# Optional Mixamo animation clips

Place Mixamo FBX animation downloads for the existing Kiro character in this directory. Export animations **without skin** and keep the original Mixamo bone names.

Development and production builds copy every `*.fbx` file from this directory into the generated public asset directory and add it to `animations.json`. The browser strips positional tracks to keep Kiro anchored, loads valid clips onto the existing skeleton, and adds clips longer than 0.4 seconds to the autonomous randomized motion pool.
