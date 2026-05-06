---
title: "System Implementation"
---

{% include nav.html %}
{% include page-assets.html cards=true implementation=true media_gallery=true model_viewer=true svg_diagram=true carousel=true %}

<div class="t2-card" id="implementation-status">
  <h2>Implementation</h2>
  <p class="t2-sub">As-built hardware, firmware, Jetson deployment, ROS 2 package integration, and operator workflow for the class-final robot.</p>
  <p>
    The final robot is a distributed system with one ESP32 responsible for power sequencing and motor-bus I/O, a Jetson Nano host responsible for the RealSense/ORB-SLAM2 CUDA process, and a ROS 2 Jazzy container responsible for state estimation, visualization, mapping, navigation, operator controls, and micro-ROS integration.
  </p>
  <div class="t2-links">
    <a class="t2-linkbtn" href="#hardware-build">Hardware build</a>
    <a class="t2-linkbtn" href="#firmware-runtime">ESP32 runtime</a>
    <a class="t2-linkbtn" href="#jetson-deployment">Jetson deployment</a>
    <a class="t2-linkbtn" href="#ros-packages">ROS 2 packages</a>
    <a class="t2-linkbtn" href="#integration-flow">Integration flow</a>
    <a class="t2-linkbtn" href="#operatorui">Operator UI</a>
  </div>
</div>

<div class="t2-card" id="hardware-build">
  <h2>Hardware Build</h2>
  <p>
    The build sequence progressed from raw aluminum stock through chassis fabrication, linkage fabrication, electronics mounting, and final assembly. The ordered carousel shows the manufacturing path rather than isolated hero photos, making the final hardware easier to relate to the design evolution and budget.
  </p>
  {% include carousel.html key="hardware_build_sequence" %}
</div>

<div class="t2-card" id="firmware-runtime">
  <h2>ESP32 Firmware Runtime</h2>
  <p>
    The ESP-IDF firmware keeps startup and runtime deliberately separate. Startup uses the slower, proven configuration path for precharge, contactor closure, servo enable, motor mode setup, torque/current limiting, speed limits, acceleration/deceleration settings, and initial zero-speed commands. Runtime then switches to short RS485 helpers for changed RPM writes and encoder reads.
  </p>
  {% include carousel.html key="esp_runtime_sequence" %}
  <div class="t2-table-wrap">
    <table class="t2-table">
      <thead><tr><th>Runtime feature</th><th>Final behavior</th><th>Reason</th></tr></thead>
      <tbody>
        <tr><td>RPM command writes</td><td>Changed-only writes by default; stop commands can preempt between RS485 transactions.</td><td>Avoids wasting the 115200 baud bus rewriting unchanged speeds.</td></tr>
        <tr><td>Encoder telemetry</td><td>Strict six-drive raw encoder sweep, then compact micro-ROS odometry publication.</td><td>Keeps all legs observable and avoids odd/even polling starvation.</td></tr>
        <tr><td>Phase semantics</td><td>ESP publishes raw 17-bit single-turn encoder counts rather than final output phase.</td><td>The 50:1 gearbox causes many motor-encoder wraps per crank revolution, so continuous phase belongs on the Jetson observer.</td></tr>
        <tr><td>Timing fields</td><td>Command sequence, receive, apply, poll, and publish timestamps are included.</td><td>Host-side estimation can reason about command propagation and measurement age.</td></tr>
      </tbody>
    </table>
  </div>
  <p class="t2-note">
    Final deployed runtime parameters from the mapping report include RS485 motor bus at 115200 baud, micro-ROS UART at 921600 baud, one runtime transaction attempt, a 25 ms six-drive encoder sweep target, a 50 ms odometry publish period, 131072 encoder counts per motor revolution, 50:1 gearbox ratio, and 250 ms / 250 ms motor driver acceleration/deceleration settings.
  </p>
</div>

<div class="t2-card" id="jetson-deployment">
  <h2>Jetson Deployment</h2>
  <p>
    The Jetson Nano deployment is split because the project needs both host-native GPU/RealSense access and a modern ROS 2 stack. ORB-SLAM2 CUDA, RealSense, CUDA/OpenCV, and Pangolin run directly on the Jetson host. ROS 2 Jazzy runs in a Docker container with host networking and the project workspace mounted for development.
  </p>
  {% include carousel.html key="jetson_deployment_sequence" %}
  <details class="t2-acc" open>
    <summary><h3>Host-native process</h3></summary>
    <div class="t2-acc-body">
      <p>
        The RealSense executable acquires aligned RGB-D frames from the D415, uses meter-scale depth, skips malformed frames, hardens startup/retry behavior, and emits UDP products to <code>127.0.0.1:5005</code> for the ROS container.
      </p>
    </div>
  </details>
  <details class="t2-acc">
    <summary><h3>Container role</h3></summary>
    <div class="t2-acc-body">
      <p>
        The container runs the hardware observers, Klann geometry model, weighted odometry fusion, ORB UDP bridge, slam_toolbox, Nav2, RViz, operator interface, and micro-ROS agent integration. Host networking keeps UDP, TF, and ROS discovery simple on the robot.
      </p>
    </div>
  </details>
</div>

<div class="t2-card" id="ros-packages">
  <h2>ROS 2 Packages</h2>
  <p>
    The ROS workspace is organized so low-level messages stay compact and high-level nodes reconstruct the robot state before planners see it.
  </p>
  <div class="t2-table-wrap">
    <table class="t2-table">
      <thead><tr><th>Package</th><th>Implemented role</th><th>Representative topics / outputs</th></tr></thead>
      <tbody>
        <tr><td><code>dsy_motor_msgs</code></td><td>ESP bridge messages for motor RPM command and six-drive raw encoder/timing telemetry.</td><td><code>/motor_rpm_cmd</code>, <code>/motor_output_odom</code></td></tr>
        <tr><td><code>hexapod_control_interfaces</code></td><td>Robot-level leg phase, motor state, actuation, and body-state messages.</td><td><code>/hexapod/phase_cmd</code>, <code>/hexapod/motor_state</code>, <code>/hexapod/body_state</code></td></tr>
        <tr><td><code>hexapod_hardware_cpp</code></td><td>Motor-state aggregation, encoder unwrap, measured Klann model, body-kinematic odometry, weighted fusion, WT901 interface, startup pose, LCD/status, and RViz markers.</td><td><code>/hexapod/kinematic_odom</code>, <code>/hexapod/fused_odom</code>, <code>/odom</code>, <code>/klann_markers</code></td></tr>
        <tr><td><code>hexapod_nav_cpp</code></td><td>Planner-facing phase prediction and phase command generation, including final phase wrapping and mirror/direction correction.</td><td>Phase targets bounded to <code>[-pi, pi]</code></td></tr>
        <tr><td><code>hexapod_orbslam_udp_bridge</code></td><td>UDP bridge from host-native ORB-SLAM2 CUDA to ROS odometry, sparse points, and depth-derived virtual scan.</td><td><code>/hexapod/orbslam_odom</code>, <code>/orbslam/map_points</code>, <code>/scan</code></td></tr>
        <tr><td><code>hexapod_operator_interface</code></td><td>Browser GUI for teleop, map viewing, waypoint goals, velocity limits, map save/load, and software e-stop.</td><td><code>/hexapod/cmd_vel_selected</code>, Nav2 goals, map service calls</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="t2-card" id="integration-flow">
  <h2>Integration Flow</h2>
  <p>
    Final bring-up combines power sequencing, encoder telemetry, host SLAM, ROS 2 mapping/control, and operator commands in a repeatable order.
  </p>
  {% include carousel.html key="integration_flow_sequence" %}
  <ol>
    <li>Precharge the 52 V bus, close the contactor, and enable the servo drivers only after voltage and timing checks pass.</li>
    <li>Validate RS485 command writes and six-drive raw encoder telemetry before commanding gait motion.</li>
    <li>Start the host-native ORB-SLAM2 CUDA/RealSense process and confirm UDP pose, points, and virtual scan output.</li>
    <li>Launch the ROS 2 container stack, verify TF/scale alignment in RViz, then enable teleop or waypoint control.</li>
  </ol>
</div>

<div class="t2-card" id="operatorui">
  <h2>Operator Interface</h2>
  <p>
    The operator interface is a browser page served from the ROS 2 side of the Jetson. It exposes teleop, velocity limits, map visualization, waypoint placement, map save/load, status display, and a software stop mode so testing can be performed without manually invoking every ROS command.
  </p>
  <p>
    The final workflow keeps the laptop as a remote terminal and visualization/control client while the robot carries the Jetson, ESP32, battery, motor drivers, and sensors onboard.
  </p>
</div>
