---
title: "System Implementation"
---

{% include nav.html %}
{% include page-assets.html cards=true implementation=true media_gallery=true model_viewer=true svg_diagram=true %}

<div class="t2-card" id="implementation-status">
  <h2>Current Implementation Status</h2>
  <p class="t2-sub">Final class stack: six RS485 servos, ESP32/micro-ROS bridge, Jetson Nano ROS 2 Jazzy container, host-native ORB-SLAM2 CUDA, slam_toolbox occupancy mapping, Nav2/operator interface, and C++ Klann kinematic odometry.</p>
  <p>
    The final implementation is a distributed cyberphysical system. The ESP32 handles power sequencing and motor-bus I/O. The Jetson host runs the D415/ORB-SLAM2 CUDA process outside Docker. The ROS 2 Jazzy container runs the hardware observers, kinematic model, odometry fusion, SLAM bridge, map generation, Nav2 bring-up, visualization, and operator interface. The result is a working class-final robot that can locomote, map, and navigate with the required order of accuracy, while retaining explicit future work for stage reliability and controller robustness.
  </p>
  <div class="t2-links">
    <a class="t2-linkbtn" href="#software-packages">ROS 2 packages</a>
    <a class="t2-linkbtn" href="#esp32">ESP32 firmware</a>
    <a class="t2-linkbtn" href="#jetson">Jetson deployment</a>
    <a class="t2-linkbtn" href="#mapping">Mapping and Nav2</a>
    <a class="t2-linkbtn" href="#kinematic-odom">Kinematic odometry</a>
    <a class="t2-linkbtn" href="#operatorui">Operator UI</a>
    <a class="t2-linkbtn" href="#media">Media placeholders</a>
  </div>
</div>

<div class="t2-card" id="software-packages">
  <h2>ROS 2 Software Packages</h2>
  <p>
    The current ROS 2 workspace is C++-oriented and aligned with ROS 2 Jazzy. The message packages keep the ESP bridge compact, while higher-level packages reconstruct the robot state and expose it to planners, visualizers, and the operator interface.
  </p>
  <div class="t2-table-wrap">
    <table class="t2-table">
      <thead><tr><th>Package</th><th>Role</th><th>Key topics / outputs</th></tr></thead>
      <tbody>
        <tr><td><code>dsy_motor_msgs</code></td><td>ESP bridge messages for motor RPM command and six-drive raw encoder/timing telemetry.</td><td><code>/motor_rpm_cmd</code>, <code>/motor_output_odom</code></td></tr>
        <tr><td><code>hexapod_control_interfaces</code></td><td>Robot-level leg phase, motor state, actuation, and body-state messages.</td><td><code>/hexapod/phase_cmd</code>, <code>/hexapod/motor_state</code>, <code>/hexapod/body_state</code></td></tr>
        <tr><td><code>hexapod_hardware_cpp</code></td><td>Motor-state aggregation, encoder unwrap, measured Klann model, body-kinematic odometry, weighted fusion, WT901 interface, startup pose, LCD/status, and RViz markers.</td><td><code>/hexapod/kinematic_odom</code>, <code>/hexapod/fused_odom</code>, <code>/odom</code>, <code>/klann_markers</code></td></tr>
        <tr><td><code>hexapod_nav_cpp</code></td><td>MPPI/local-planner-facing phase prediction and phase command generation, including final phase wrapping and mirror/direction correction.</td><td>Phase targets bounded to <code>[-pi, pi]</code></td></tr>
        <tr><td><code>hexapod_orbslam_udp_bridge</code></td><td>UDP bridge from host-native ORB-SLAM2 CUDA to ROS odometry, sparse points, and depth-derived virtual scan.</td><td><code>/hexapod/orbslam_odom</code>, <code>/orbslam/map_points</code>, <code>/scan</code></td></tr>
        <tr><td><code>hexapod_operator_interface</code></td><td>Browser GUI for teleop, map viewing, waypoint goal placement, velocity limits, map save/load, and software e-stop.</td><td><code>/hexapod/cmd_vel_selected</code>, Nav2 goals, map service actions</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="t2-card" id="esp32">
  <h2>ESP32 Firmware and Motor Bridge</h2>
  <p>
    The ESP-IDF firmware owns the low-level safety and timing path. It performs precharge/contactor sequencing, shared servo-enable control, motor-driver setup, torque/current limiting, speed-mode setup, acceleration/deceleration register configuration, and an initial zero-speed command before entering the faster runtime path.
  </p>
  <details class="t2-acc" open>
    <summary><h3>Runtime scheduler</h3></summary>
    <div class="t2-acc-body">
      <p>
        Runtime uses changed-only RPM command writes and a strict six-drive raw-encoder sweep. A pending all-zero RPM command preempts an active sweep between RS485 transactions, so stop commands are prioritized. A pending nonzero command is applied when no sweep is active. The firmware publishes compact odometry with raw single-turn encoder counts, unwrapped local count estimates, and ESP-domain timing fields.
      </p>
      <ul>
        <li>RS485 motor bus default: 115200 baud.</li>
        <li>micro-ROS UART default: 921600 baud.</li>
        <li>Six-drive encoder sweep period: 25 ms target.</li>
        <li>Odometry publication period: 50 ms.</li>
        <li>Runtime response timeout / turnaround delay: 50 ms and 2 ms in the final defaults.</li>
      </ul>
    </div>
  </details>
  <details class="t2-acc">
    <summary><h3>Why raw encoder counts are published</h3></summary>
    <div class="t2-acc-body">
      <p>
        The installed M17S encoders are 17-bit single-turn motor encoders. A 50:1 gearbox means one output crank revolution spans 50 motor revolutions, so any ESP-side modulo-to-output-phase conversion can hide wrap ambiguity. The final path sends raw counts to the Jetson, where command history, timing fields, acceleration/deceleration settings, and linkage constraints can be used to reconstruct continuous output phase.
      </p>
    </div>
  </details>
</div>

<div class="t2-card" id="jetson">
  <h2>Jetson Deployment</h2>
  <p>
    The Jetson Nano uses a split deployment because the project needs both host-native GPU/RealSense control and a modern ROS 2 stack. ORB-SLAM2 CUDA, RealSense, CUDA/OpenCV, and Pangolin remain on the host. ROS 2 Jazzy runs in a Docker container with host networking and the project workspace bind-mounted for development.
  </p>
  <details class="t2-acc" open>
    <summary><h3>Host-native ORB-SLAM2 service</h3></summary>
    <div class="t2-acc-body">
      <p>
        The ORB-SLAM2 RealSense executable runs as a supervised host process/service. It acquires aligned RGB-D frames from the D415, uses meter-scale depth, hardens startup/retry behavior, skips malformed frames, and emits UDP pose, sparse map chunks, and optional virtual scan packets to <code>127.0.0.1:5005</code> for the ROS container.
      </p>
    </div>
  </details>
  <details class="t2-acc">
    <summary><h3>ROS container role</h3></summary>
    <div class="t2-acc-body">
      <p>
        The Jazzy container runs the C++ hardware stack, ORB UDP bridge, slam_toolbox, Nav2, visualization, operator interface, and micro-ROS agent integration. It uses host networking so UDP, TF, and ROS discovery stay simple on the robot.
      </p>
    </div>
  </details>
</div>

<div class="t2-card" id="mapping">
  <h2>Mapping, Nav2, and TF</h2>
  <p>
    ORB-SLAM2 provides camera odometry and sparse visual landmarks. The ROS bridge also produces a lightweight virtual planar scan from the depth image; slam_toolbox consumes that scan to build the 2D occupancy grid used by Nav2 and the operator interface. The sparse ORB point cloud is for scale/axis validation and visualization, not itself the occupancy map.
  </p>
  <details class="t2-acc" open>
    <summary><h3>Final TF ownership</h3></summary>
    <div class="t2-acc-body">
      <ul>
        <li><code>slam_toolbox</code> owns <code>map → odom</code>.</li>
        <li><code>weighted_odom_fusion_node</code> owns <code>odom → base_link</code>.</li>
        <li><code>hexapod_orbslam_udp_bridge</code> publishes ORB odometry, map points, and scan, but does not publish a competing body TF in fused mode.</li>
        <li><code>base_link → orbslam_scan_frame</code> uses the measured forward camera offset, 11 in or 0.2794 m.</li>
      </ul>
    </div>
  </details>
  <details class="t2-acc">
    <summary><h3>Launch-scale calibration</h3></summary>
    <div class="t2-acc-body">
      <p>
        Tape-measured tests led to empirical ORB/scan scale parameters. The launch path supports <code>position_scale</code> and <code>scan_range_scale</code> so pose, sparse points, and virtual scan ranges stay in the same metric scale. The final mapping report treats these as calibration parameters that still need more forward, reverse, and turning trials before any stage deployment.
      </p>
    </div>
  </details>
</div>

<div class="t2-card" id="kinematic-odom">
  <h2>Klann Kinematic Odometry</h2>
  <p>
    The host-side estimator reconstructs continuous crank phase from raw motor encoder counts, evaluates the measured Klann geometry, and estimates planar body twist from stance-foot no-slip constraints. At least three stance legs are required before the body-twist estimate is trusted, matching the alternating tripod gait concept.
  </p>
  <details class="t2-acc" open>
    <summary><h3>Lookup-table model</h3></summary>
    <div class="t2-acc-body">
      <p>
        The same measured geometry is shared by the visualizer, body estimator, and phase controller. For runtime deployment, a lookup-table generator can precompute phase-to-foot position, derivative, and stance confidence. Production table resolution should be chosen from interpolation error in the smooth output-crank trajectory; the mapping report recommends roughly 8192 to 16384 samples per output crank revolution for production use, with larger tables used only for offline validation.
      </p>
    </div>
  </details>
  <details class="t2-acc">
    <summary><h3>Deterministic observer vs. EKF</h3></summary>
    <div class="t2-acc-body">
      <p>
        The final observer is deterministic and delay-aware, not a full Kalman filter. A future per-leg EKF could estimate continuous motor count, velocity, acceleration or latency bias, and wrap index using RPM command as process input and raw encoder count as measurement. That would add uncertainty handling and rejection of stale reads, but also adds tuning cost and can hide bus-timing bugs during integration.
      </p>
    </div>
  </details>
</div>

<div class="t2-card" id="operatorui">
  <h2>Operator Interface</h2>
  <p>
    The browser operator interface is intended for off-stage operation and debugging. It displays map state, robot pose/skeleton context, battery/status values, mode state, and diagnostics. It can command teleop velocities, set linear/angular limits for waypoint operation, cancel goals, hold a software emergency-stop mode, save/load occupancy maps on the Jetson, and place Nav2 goals from the map view.
  </p>
</div>

<div class="t2-card" id="media">
  <h2>Implementation Media Placeholders</h2>
  <p class="t2-sub">The following cards are safe placeholders. They will not load broken files until the corresponding media is committed and the item is marked ready in <code>_data/media_assets.yml</code>.</p>
  {% include asset-gallery.html key="circuit_photos" %}
  {% include asset-gallery.html key="software_visuals" %}
  {% include asset-gallery.html key="videos" %}
</div>
