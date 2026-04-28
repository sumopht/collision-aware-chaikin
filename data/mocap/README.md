# Motion-capture data

This folder is intentionally empty.

The project brief lists motion-capture data as a recommended secondary
data source. We did not use it because mocap data is 3D joint-trajectory
data sampled at ~120 Hz, and our project is a 2D static-obstacle path
smoother. The two domains do not overlap, so feeding mocap into our
algorithm would not produce meaningful results.

This is documented honestly in the report's Section V (Experimental
Setup) and Section VII-B (Limitations).
