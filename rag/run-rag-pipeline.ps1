#requires -Version 7.3

[CmdletBinding()]
param(
    [switch]$LocalOnly,
    [switch]$Resume,
    [switch]$SkipSourceSync,
    [switch]$Rollback,
    [switch]$CleanupReleases,
    [switch]$ApproveRemote
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($LocalOnly -and $ApproveRemote) {
    throw '-LocalOnly and -ApproveRemote cannot be used together.'
}
if ($Rollback -and ($LocalOnly -or $Resume -or $SkipSourceSync -or $CleanupReleases -or $ApproveRemote)) {
    throw '-Rollback must be used by itself.'
}
if ($CleanupReleases -and ($LocalOnly -or $Resume -or $SkipSourceSync -or $Rollback -or $ApproveRemote)) {
    throw '-CleanupReleases must be used by itself.'
}

$RagRoot = $PSScriptRoot
$PipelineRoot = Join-Path $RagRoot 'rag-next-pipeline'
$ProjectRoot = Split-Path -Parent $RagRoot
$RunId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
$RunLogRoot = Join-Path $PipelineRoot "logs/runs/$RunId"
$StatePath = Join-Path $PipelineRoot 'logs/pipeline-run-state.json'
$OverallLog = Join-Path $RunLogRoot 'overall.log'
$SourceRemoteName = 'origin'
$SourceBranch = 'main'

$Paths = @{
    SourceRoot = Join-Path $PipelineRoot '00-source/portfolio-rag'
    Source = Join-Path $PipelineRoot '00-source/portfolio-rag/repositories'
    Stage1Manifest = Join-Path $PipelineRoot '01-corpus/output/manifest.json'
    Stage2Documents = Join-Path $PipelineRoot '02-retrieval-documents/output/documents.jsonl'
    Stage2Manifest = Join-Path $PipelineRoot '02-retrieval-documents/output/document-manifest.json'
    EmbeddingManifest = Join-Path $PipelineRoot '03-embeddings/output/embeddings-cloudflare-v1/embedding-manifest.json'
    D1Sql = Join-Path $PipelineRoot '04-runtime-metadata/output/d1-runtime-v1/rag-documents.sql'
    VectorizeManifest = Join-Path $PipelineRoot '05-vector-index/output/vectorize-cloudflare-v1/vectorize-publication-manifest.json'
    Release = Join-Path $PipelineRoot '02-retrieval-documents/output/release.json'
}

function Get-FileFingerprint {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-TreeFingerprint {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Container)) { return $null }
    $lines = Get-ChildItem -LiteralPath $Path -File -Recurse |
        Sort-Object FullName |
        ForEach-Object {
            $relative = [IO.Path]::GetRelativePath($Path, $_.FullName).Replace('\', '/')
            "$relative`t$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant())"
        }
    $bytes = [Text.Encoding]::UTF8.GetBytes(($lines -join "`n"))
    return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
}

function Get-WorkerFingerprint {
    $parts = @(
        "worker`t$(Get-TreeFingerprint (Join-Path $ProjectRoot 'worker'))"
        "wrangler.jsonc`t$(Get-FileFingerprint (Join-Path $ProjectRoot 'wrangler.jsonc'))"
        "package.json`t$(Get-FileFingerprint (Join-Path $ProjectRoot 'package.json'))"
        "package-lock.json`t$(Get-FileFingerprint (Join-Path $ProjectRoot 'package-lock.json'))"
    )
    $bytes = [Text.Encoding]::UTF8.GetBytes(($parts -join "`n"))
    return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
}

function New-RagRelease {
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$SourceProvenance,
        [Parameter(Mandatory)][string]$DocumentsSha256
    )
    $material = "rag-release-v1`n$($SourceProvenance.sourceCommit)`n$DocumentsSha256"
    $bytes = [Text.Encoding]::UTF8.GetBytes($material)
    $digest = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant()
    $release = [ordered]@{
        schema_version = 1
        release_id = "rag-$($digest.Substring(0, 24))"
        source_commit = $SourceProvenance.sourceCommit
        retrieval_documents_sha256 = $DocumentsSha256
        derivation_sha256 = $digest
        created_at = (Get-Date).ToUniversalTime().ToString('o')
    }
    $release | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Paths.Release -Encoding utf8
    $release | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $RunLogRoot 'rag-release.json') -Encoding utf8
    return $release
}

function New-RunState {
    return [ordered]@{
        schemaVersion = 2
        updatedAt = (Get-Date).ToUniversalTime().ToString('o')
        source = [ordered]@{}
        completedStages = @()
        fingerprints = [ordered]@{}
    }
}

function Invoke-GitText {
    param([Parameter(Mandatory)][string[]]$Arguments)
    $previousNativePreference = $PSNativeCommandUseErrorActionPreference
    $PSNativeCommandUseErrorActionPreference = $false
    try {
        $output = & git -C $ProjectRoot @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $PSNativeCommandUseErrorActionPreference = $previousNativePreference
    }
    if ($exitCode -ne 0) {
        throw "Git command failed: git -C `"$ProjectRoot`" $($Arguments -join ' ')`n$($output -join "`n")"
    }
    return ($output -join "`n").Trim()
}

function Write-SourceProvenance {
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$Provenance,
        [Parameter(Mandatory)][string]$Destination
    )
    New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
    $Provenance | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $Destination -Encoding utf8
}

function Initialize-Source {
    param([Parameter(Mandatory)][System.Collections.IDictionary]$State)

    $gitRoot = (Invoke-GitText @('rev-parse', '--show-toplevel')).Replace('/', '\')
    if ([IO.Path]::GetFullPath($gitRoot) -ne [IO.Path]::GetFullPath($ProjectRoot)) {
        throw "Stage 00 expected Git root '$ProjectRoot' but found '$gitRoot'."
    }

    $sourceRelativePath = [IO.Path]::GetRelativePath($ProjectRoot, $Paths.SourceRoot).Replace('\', '/')
    $remoteUrl = Invoke-GitText @('remote', 'get-url', $SourceRemoteName)
    $currentBranch = Invoke-GitText @('branch', '--show-current')
    if ($currentBranch -ne $SourceBranch) {
        throw "Stage 00 requires branch '$SourceBranch'; current branch is '$currentBranch'."
    }

    $dirty = Invoke-GitText @('status', '--porcelain=v1', '--untracked-files=all', '--', $sourceRelativePath)
    if ($dirty) {
        throw "Stage 00 source is dirty or untracked. Commit, stash, or deliberately reconcile these files before running; nothing was reset.`n$dirty"
    }

    if ($Resume) {
        if (-not $State.Contains('source') -or $null -eq $State.source -or -not $State.source.Contains('commit') -or -not $State.source.Contains('treeFingerprint')) {
            throw 'The saved run has no Stage 00 source provenance and cannot be resumed safely. Start a new run or use a state file created by this runner version.'
        }
        $commit = Invoke-GitText @('rev-parse', 'HEAD')
        $treeFingerprint = Get-TreeFingerprint $Paths.SourceRoot
        if ($commit -ne $State.source.commit -or $treeFingerprint -ne $State.source.treeFingerprint) {
            throw "Resume source mismatch. Recorded commit: $($State.source.commit); current commit: $commit. Restore the recorded revision before resuming."
        }
        Write-SkippedStage 0 'Sync source corpus' 'resume uses the recorded source revision; no fetch performed' '00-source-sync.log'
    }
    elseif ($SkipSourceSync) {
        $commit = Invoke-GitText @('rev-parse', 'HEAD')
        $treeFingerprint = Get-TreeFingerprint $Paths.SourceRoot
        Write-SkippedStage 0 'Sync source corpus' 'SkipSourceSync uses the current clean checkout; no fetch performed' '00-source-sync.log'
    }
    else {
        Invoke-PipelineStage 0 'Sync source corpus' '00-source-sync.log' $ProjectRoot 'git' @('-C', $ProjectRoot, 'pull', '--ff-only', $SourceRemoteName, $SourceBranch)
        $postPullDirty = Invoke-GitText @('status', '--porcelain=v1', '--untracked-files=all', '--', $sourceRelativePath)
        if ($postPullDirty) { throw "Stage 00 update did not leave the source clean.`n$postPullDirty" }
        $commit = Invoke-GitText @('rev-parse', 'HEAD')
        $treeFingerprint = Get-TreeFingerprint $Paths.SourceRoot
    }

    $provenance = [ordered]@{
        schemaVersion = 1
        sourceRepository = $remoteUrl
        sourceRemote = $SourceRemoteName
        sourceBranch = $SourceBranch
        sourceCommit = $commit
        sourcePath = $sourceRelativePath
        sourceTreeSha256 = $treeFingerprint
        synchronized = (-not $Resume -and -not $SkipSourceSync)
        recordedAt = (Get-Date).ToUniversalTime().ToString('o')
        runId = $RunId
    }
    $State.source = [ordered]@{
        repository = $remoteUrl
        remote = $SourceRemoteName
        branch = $SourceBranch
        commit = $commit
        path = $sourceRelativePath
        treeFingerprint = $treeFingerprint
    }
    Complete-Stage $State '00-source' @{ source = $treeFingerprint; sourceCommit = $commit }
    Write-SourceProvenance $provenance (Join-Path $RunLogRoot 'source-provenance.json')
    Write-SourceProvenance $provenance (Join-Path $PipelineRoot 'logs/source-provenance.json')
    return $provenance
}

function Read-RunState {
    if (-not $Resume -or -not (Test-Path -LiteralPath $StatePath -PathType Leaf)) {
        return New-RunState
    }
    return Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json -AsHashtable
}

function Save-RunState {
    param([Parameter(Mandatory)][System.Collections.IDictionary]$State)
    $State.updatedAt = (Get-Date).ToUniversalTime().ToString('o')
    $tempPath = "$StatePath.tmp"
    $State | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $tempPath -Encoding utf8
    Move-Item -LiteralPath $tempPath -Destination $StatePath -Force
}

function Test-StageComplete {
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$State,
        [Parameter(Mandatory)][string]$Stage,
        [Parameter(Mandatory)][System.Collections.IDictionary]$RequiredFingerprints
    )
    if (-not $Resume -or $Stage -notin @($State.completedStages)) { return $false }
    foreach ($key in $RequiredFingerprints.Keys) {
        if (-not $State.fingerprints.Contains($key) -or $State.fingerprints[$key] -ne $RequiredFingerprints[$key]) {
            return $false
        }
    }
    return $true
}

function Complete-Stage {
    param(
        [Parameter(Mandatory)][System.Collections.IDictionary]$State,
        [Parameter(Mandatory)][string]$Stage,
        [Parameter(Mandatory)][System.Collections.IDictionary]$Fingerprints
    )
    if ($Stage -notin @($State.completedStages)) {
        $State.completedStages = @($State.completedStages) + $Stage
    }
    foreach ($key in $Fingerprints.Keys) { $State.fingerprints[$key] = $Fingerprints[$key] }
    Save-RunState $State
}

function Format-Command {
    param([string]$Executable, [string[]]$Arguments)
    $formatted = @($Executable) + @($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ }
    })
    return $formatted -join ' '
}

function Invoke-PipelineStage {
    param(
        [Parameter(Mandatory)][int]$Number,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$LogName,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$Executable,
        [string[]]$Arguments = @()
    )
    $stageLog = Join-Path $RunLogRoot $LogName
    $command = Format-Command $Executable $Arguments
    Write-Host "[$Number/6] $Name"
    "[$(Get-Date -Format o)] WORKDIR: $WorkingDirectory`nCOMMAND: $command" | Tee-Object -FilePath $stageLog -Append
    Push-Location $WorkingDirectory
    try {
        $previousNativePreference = $PSNativeCommandUseErrorActionPreference
        $PSNativeCommandUseErrorActionPreference = $false
        & $Executable @Arguments 2>&1 | Tee-Object -FilePath $stageLog -Append
        $exitCode = $LASTEXITCODE
        $PSNativeCommandUseErrorActionPreference = $previousNativePreference
    }
    finally {
        Pop-Location
    }
    "[$(Get-Date -Format o)] EXIT CODE: $exitCode" | Tee-Object -FilePath $stageLog -Append
    if ($exitCode -ne 0) {
        throw "Stage failed with exit code $exitCode.`nCommand: $command`nOutput: $stageLog"
    }
}

function Write-SkippedStage {
    param([int]$Number, [string]$Name, [string]$Reason, [string]$LogName)
    $message = "[$Number/6] $Name - SKIPPED ($Reason)"
    Write-Host $message
    $message | Set-Content -LiteralPath (Join-Path $RunLogRoot $LogName) -Encoding utf8
}

New-Item -ItemType Directory -Path $RunLogRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $StatePath) -Force | Out-Null
Start-Transcript -LiteralPath $OverallLog -Force | Out-Null
$runSucceeded = $false

try {
    if ($Rollback) {
        Invoke-PipelineStage 6 'Rollback active RAG release' 'rollback.log' $ProjectRoot 'npm' @('run', 'rag:release', '--', '--rollback')
        $runSucceeded = $true
        return
    }
    if ($CleanupReleases) {
        Invoke-PipelineStage 6 'Clean obsolete RAG releases' 'release-cleanup.log' $ProjectRoot 'npm' @('run', 'rag:release', '--', '--cleanup')
        $runSucceeded = $true
        return
    }
    foreach ($requiredPath in @($PipelineRoot, $ProjectRoot, $Paths.SourceRoot, $Paths.Source)) {
        if (-not (Test-Path -LiteralPath $requiredPath)) { throw "Required path is missing: $requiredPath" }
    }

    $state = Read-RunState
    $sourceProvenance = Initialize-Source $state
    $sourceFingerprint = Get-TreeFingerprint $Paths.Source
    $stage1Fingerprint = Get-FileFingerprint $Paths.Stage1Manifest

    if (Test-StageComplete $state '01-corpus' @{ source = $sourceFingerprint; stage1Manifest = $stage1Fingerprint }) {
        Write-SkippedStage 1 'Build corpus' 'resume fingerprints match' '01-corpus.log'
    }
    else {
        Invoke-PipelineStage 1 'Build corpus' '01-corpus.log' $RagRoot 'python' @('rag-next-pipeline/01-corpus/scripts/prepare-rag-corpus.py')
        $stage1Fingerprint = Get-FileFingerprint $Paths.Stage1Manifest
        Complete-Stage $state '01-corpus' @{ source = $sourceFingerprint; stage1Manifest = $stage1Fingerprint }
    }
    Write-SourceProvenance $sourceProvenance (Join-Path $PipelineRoot '01-corpus/output/source-provenance.json')

    $stage2DocumentsFingerprint = Get-FileFingerprint $Paths.Stage2Documents
    $stage2ManifestFingerprint = Get-FileFingerprint $Paths.Stage2Manifest
    if (Test-StageComplete $state '02-retrieval-documents' @{
        stage1Manifest = $stage1Fingerprint
        stage2Documents = $stage2DocumentsFingerprint
        stage2Manifest = $stage2ManifestFingerprint
    }) {
        Write-SkippedStage 2 'Build retrieval documents' 'resume fingerprints match' '02-retrieval-documents.log'
    }
    else {
        Invoke-PipelineStage 2 'Build retrieval documents' '02-retrieval-documents.log' $RagRoot 'python' @('rag-next-pipeline/02-retrieval-documents/scripts/build-rag-retrieval-documents-v2.py')
        $stage2DocumentsFingerprint = Get-FileFingerprint $Paths.Stage2Documents
        $stage2ManifestFingerprint = Get-FileFingerprint $Paths.Stage2Manifest
        Complete-Stage $state '02-retrieval-documents' @{
            stage1Manifest = $stage1Fingerprint
            stage2Documents = $stage2DocumentsFingerprint
            stage2Manifest = $stage2ManifestFingerprint
        }
    }
    Write-SourceProvenance $sourceProvenance (Join-Path $PipelineRoot '02-retrieval-documents/output/source-provenance.json')
    $release = New-RagRelease $sourceProvenance $stage2DocumentsFingerprint
    $state['release'] = $release
    Save-RunState $state
    Write-Host "Built release: $($release.release_id)"

    if ($LocalOnly) {
        Invoke-PipelineStage 3 'Validate embedding inputs (local only)' '03-embeddings-validation.log' $RagRoot 'node' @('rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs', '--validate-only')
        Write-Host 'Local-only run complete. No Cloudflare operation was invoked.'
        $runSucceeded = $true
        return
    }

    $embeddingFingerprint = Get-FileFingerprint $Paths.EmbeddingManifest
    $stage3Complete = Test-StageComplete $state '03-embeddings' @{
        stage2Documents = $stage2DocumentsFingerprint
        embeddingManifest = $embeddingFingerprint
    }

    if (-not $stage3Complete) {
        if (-not $ApproveRemote) {
            Write-Host ''
            Write-Host 'Workers AI authorization boundary' -ForegroundColor Yellow
            Write-Host 'Stage 03 may send document text to Cloudflare Workers AI and consume paid quota.'
            $answer = Read-Host 'Type YES to authorize Stage 03 and all remaining Cloudflare publication/deployment steps'
            if ($answer -cne 'YES') { throw 'Remote pipeline phase was not authorized.' }
        }
        Invoke-PipelineStage 3 'Generate/reuse embeddings' '03-embeddings.log' $RagRoot 'node' @('rag-next-pipeline/03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs', '--generate')
        $embeddingFingerprint = Get-FileFingerprint $Paths.EmbeddingManifest
        Complete-Stage $state '03-embeddings' @{
            stage2Documents = $stage2DocumentsFingerprint
            embeddingManifest = $embeddingFingerprint
        }
    }
    else {
        Write-SkippedStage 3 'Generate/reuse embeddings' 'resume fingerprints match' '03-embeddings.log'
    }
    Write-SourceProvenance $sourceProvenance (Join-Path $PipelineRoot '03-embeddings/output/embeddings-cloudflare-v1/source-provenance.json')
    $release.embedding_manifest_sha256 = $embeddingFingerprint
    $release | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Paths.Release -Encoding utf8

    $d1Fingerprint = Get-FileFingerprint $Paths.D1Sql
    if (Test-StageComplete $state '04-d1' @{ stage2Documents = $stage2DocumentsFingerprint; d1Sql = $d1Fingerprint }) {
        Write-SkippedStage 4 'Build/import D1 corpus' 'resume fingerprints match' '04-d1.log'
    }
    else {
        Invoke-PipelineStage 4 'Apply D1 release schema' '04-d1-migrations.log' $ProjectRoot 'npm' @('run', 'db:migrate:remote')
        Invoke-PipelineStage 4 'Build D1 corpus' '04-d1-build.log' $RagRoot 'node' @('rag-next-pipeline/04-runtime-metadata/scripts/build-d1-rag-import.mjs')
        Invoke-PipelineStage 4 'Import D1 corpus' '04-d1-import.log' $ProjectRoot 'npm' @('run', 'rag:d1:import:remote')
        $d1Fingerprint = Get-FileFingerprint $Paths.D1Sql
        Complete-Stage $state '04-d1' @{ stage2Documents = $stage2DocumentsFingerprint; d1Sql = $d1Fingerprint }
    }
    Write-SourceProvenance $sourceProvenance (Join-Path $PipelineRoot '04-runtime-metadata/output/d1-runtime-v1/source-provenance.json')

    if (Test-StageComplete $state '05-vectorize' @{ embeddingManifest = $embeddingFingerprint }) {
        Write-SkippedStage 5 'Publish Vectorize corpus' 'resume fingerprints match' '05-vectorize.log'
    }
    else {
        Invoke-PipelineStage 5 'Publish Vectorize corpus' '05-vectorize.log' $RagRoot 'node' @('rag-next-pipeline/05-vector-index/scripts/cloudflare-vectorize/publish-vectorize-v1.mjs')
        Invoke-PipelineStage 5 'Mark Vectorize release ready' '05-vectorize-d1-marker.log' $ProjectRoot 'npm' @('run', 'rag:vectorize:mark:remote')
        Complete-Stage $state '05-vectorize' @{
            embeddingManifest = $embeddingFingerprint
            vectorizeManifest = (Get-FileFingerprint $Paths.VectorizeManifest)
        }
    }
    Write-SourceProvenance $sourceProvenance (Join-Path $PipelineRoot '05-vector-index/output/vectorize-cloudflare-v1/source-provenance.json')

    $releaseBuildPath = Join-Path $ProjectRoot 'worker/rag-release-build.ts'
    "// Generated by rag/run-rag-pipeline.ps1.`nexport const DEPLOYED_RAG_RELEASE_ID = '$($release.release_id)';`n" | Set-Content -LiteralPath $releaseBuildPath -Encoding utf8
    $workerFingerprint = Get-WorkerFingerprint
    if (Test-StageComplete $state '06-worker' @{ worker = $workerFingerprint }) {
        Write-SkippedStage 6 'Deploy Worker' 'resume fingerprints match' '06-worker.log'
    }
    else {
        Invoke-PipelineStage 6 'Deploy Worker' '06-worker.log' $ProjectRoot 'npm' @('run', 'worker:deploy')
        Complete-Stage $state '06-worker' @{ worker = $workerFingerprint }
    }

    Invoke-PipelineStage 6 'Switch active RAG release' '06-cutover.log' $ProjectRoot 'npm' @('run', 'rag:release', '--', '--activate', $release.release_id, '--deployed-release', $release.release_id)
    Write-Host 'D1 published'
    Write-Host 'Vectorize published'
    Write-Host 'Worker deployed'
    Write-Host "Active release switched: $($release.release_id)"

    try {
        Invoke-PipelineStage 6 'Clean obsolete RAG releases' '06-release-cleanup.log' $ProjectRoot 'npm' @('run', 'rag:release', '--', '--cleanup')
    }
    catch {
        throw "Release $($release.release_id) is active and production was not rolled back, but obsolete-release cleanup failed. $($_.Exception.Message)"
    }

    $runSucceeded = $true
    Write-Host "Pipeline completed successfully. Logs: $RunLogRoot"
}
catch {
    Write-Error "Pipeline stopped: $($_.Exception.Message)"
    throw
}
finally {
    if (-not $runSucceeded) { Write-Host "Run failed. Preserved logs: $RunLogRoot" -ForegroundColor Red }
    Stop-Transcript | Out-Null
}
