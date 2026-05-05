---
title: "System Implementation"
---

{% include nav.html %}
{% include page-assets.html cards=true implementation=true media_gallery=true model_viewer=true svg_diagram=true %}

<div class="t2-card" id="implementation-status">
  <h2>Implementation</h2>
  <p class="t2-sub">Implementation page scope: what was actually built, how it is wired/deployed, and how the final class stack is operated. Design rationale is on the Design page; measured results are on the Performance page.</p>
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
    The final physical implementation combines the Klann linkage chassis, six motor/gearbox leg modules, the high-current power path, the compute/control electronics, and a cover/lid system. The media in this section is intentionally build-focused rather than design-focused: it should show assembly, wiring, and field/debugging states.
  </p>
  <div class="media-row">
    <div class="media-row-copy">
      <h3>Assembly state before cover</h3>
      <p>
        Use <code>full_assembly_no_lid.jpg</code> here to show the implementation layout after the major subsystems have been installed but before the final cover hides the wiring and internal structure. This is the best reference image for reviewers trying to understand how the final machine was physically integrated.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="build_photos" index=0 layout="wide" %}
    </div>
  </div>
  <div class="media-row media-row--reverse">
    <div class="media-row-copy">
      <h3>Electrical bring-up and mounting</h3>
      <p>
        The mainboard-in-progress and PCB-mount prototype images should sit with the electrical implementation text because they document the actual packaging and iteration process behind the final wiring, not just the schematic-level architecture.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="circuit_photos" index=1 layout="wide" %}
    </div>
  </div>
</div>

<div class="t2-card" id="firmware-runtime">
  <h2>ESP32 Firmware Runtime</h2>
  <p>
    The ESP-IDF firmware keeps startup and runtime deliberately separate. Startup uses the slower, proven configuration path for precharge, contactor closure, servo enable, motor mode setup, torque/current limiting, speed limits, acceleration/deceleration settings, and initial zero-speed commands. Runtime then switches to short RS485 helpers for changed RPM writes and encoder reads.
  </p>
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
  <div class="media-row">
    <div class="media-row-copy">
      <h3>ORB-SLAM bridge output</h3>
      <p>
        The ORB-SLAM odometry animation belongs here because it documents the deployed host/container boundary: host-native ORB-SLAM2 CUDA emits UDP pose, sparse map points, and virtual scan data that are consumed by the ROS 2 bridge inside the container.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="videos" index=6 layout="wide" %}
    </div>
  </div>
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
    The final bring-up sequence starts with safe power sequencing and motor readiness, then validates encoder telemetry, then starts the Jetson SLAM process, then launches the ROS 2 mapping/control stack, and only then enables teleop or waypoint commands. This ordering prevents TF/map debugging from being confused with lower-level motor or power faults.
  </p>
  <div class="media-row media-row--reverse">
    <div class="media-row-copy">
      <h3>Debugging and field integration</h3>
      <p>
        Use <code>debugging.jpg</code> or <code>working_on_bot.jpg</code> here to show the practical integration loop: hardware access, laptop/Jetson inspection, RS485/micro-ROS validation, and mapping tests performed on the assembled platform.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="build_photos" index=4 layout="wide" %}
    </div>
  </div>
  <ol>
    <li>Bring up low-voltage control, precharge the motor bus, close the contactor, and release the shared servo-enable path.</li>
    <li>Verify ESP32 micro-ROS connection and six-drive raw encoder telemetry.</li>
    <li>Start host-native RealSense/ORB-SLAM2 CUDA and confirm UDP pose/scan/map-point packets.</li>
    <li>Launch ROS 2 Jazzy mapping/control stack, checking <code>map</code>, <code>odom</code>, <code>base_link</code>, and <code>orbslam_scan_frame</code>.</li>
    <li>Use browser teleop or waypoint goals once odometry, scan, and map products are visible.</li>
  </ol>
</div>

<div class="t2-card" id="operatorui">
  <h2>Operator Interface</h2>
  <p>
    The browser operator interface is intended for off-stage operation and debugging. It displays map state, robot pose/skeleton context, battery/status values, mode state, and diagnostics. It can command teleop velocities, set linear/angular limits for waypoint operation, cancel goals, hold a software emergency-stop mode, save/load occupancy maps on the Jetson, and place Nav2 goals from the map view.
  </p>
</div>
