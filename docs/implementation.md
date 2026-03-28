---
title: "System Implementation"
---

{% include nav.html %}
{% include page-assets.html cards=true implementation=true %}

<div class="t2-card" id="implementation-status">
  <h2>Current Implementation Status</h2>
  <p class="t2-sub">The implementation is now distributed across four concrete layers: MuJoCo + ROS simulation, a control-station GUI, a Jetson deployment split between containers and host-native GPU code, and an ESP32 firmware stack for sensing and bench actuator bring-up.</p>
  <p>The current repository state already covers a ROS 2 Jazzy simulation boundary, a PyQt operator dashboard, a structured gait controller with MJX/JAX tuning scripts, a host-native ORB-SLAM2 RGB-D wrapper for the Jetson, a Dockerized ROS bring-up environment, and an ESP32 firmware package that publishes IMU and force-sensor telemetry while also exercising the six DSY-RS drives through a smoke-test RS485 path. Mechanical assembly and final high-current packaging still need a later as-built update, but the software and embedded bring-up story is now broad enough to document end to end.</p>
  <div class="t2-links">
    <a class="t2-linkbtn" href="#media">Implementation Media</a>
    <a class="t2-linkbtn" href="#computesensing">Compute &amp; Sensing</a>
    <a class="t2-linkbtn" href="#jetson">Jetson Deployment</a>
    <a class="t2-linkbtn" href="#ros">Software Interface</a>
    <a class="t2-linkbtn" href="#operatorui">Operator UI</a>
    <a class="t2-linkbtn" href="#localcontroller">Local Controller</a>
    <a class="t2-linkbtn" href="#simulation">Simulation</a>
    <a class="t2-linkbtn" href="#slam">SLAM</a>
    <a class="t2-linkbtn" href="#esp32">ESP32 Firmware</a>
    <a class="t2-linkbtn" href="#training">MJX Tuning</a>
  </div>
</div>

<div class="t2-card" id="media">
  <h2>Implementation Media</h2>
  <p class="t2-sub">Runtime evidence for the current software and embedded stack.</p>
  <p>This gallery is intended to show the present Jetson-side SLAM runtime, the operator / bring-up GUI behavior, and the current circuit-level bench integration. The file paths are centralized so that new videos or updated build photos can be swapped in without editing the page layout itself.</p>
  {% include implementation-media-grid.html %}
</div>

<div class="t2-card" id="chassisassembly">
  <h2>Chassis Assembly</h2>
  <p class="t2-sub">Pending current mechanical assembly status update.</p>
  <p>This section will document the physical build sequence, major subassemblies, mounting strategy, and as-built deviations from the CAD model once the latest hardware integration snapshot is available.</p>
</div>

<div class="t2-card" id="legfabrication">
  <h2>Leg Fabrication</h2>
  <p class="t2-sub">Pending current linkage and manufacturing status update.</p>
  <p>This section will be expanded with the current fabrication workflow for the Klann linkage legs, any machining or printed components, tolerance-sensitive joints, and assembly notes from the present prototype revision.</p>
</div>

<div class="t2-card" id="computesensing">
  <h2>Compute &amp; Sensing</h2>
  <p class="t2-sub">The sensing stack is no longer only conceptual; the simulation, Jetson, and ESP32 layers now share explicit interface boundaries.</p>
  <p>The present implementation assumes a forward RGB-D camera, IMU, odometry, battery-state, diagnostics, and optional per-leg analog force telemetry on the ROS graph. In simulation, those interfaces are synthesized by the MuJoCo bridge. On the Jetson, the RGB-D path is paired with a host-native ORB-SLAM2 RealSense wrapper, while the operator-side GUI subscribes to color, depth, IMU, odometry, battery, diagnostics, and force-sensor topics for live monitoring and command entry.</p>
  <p>At the embedded boundary, the ESP32 currently reads six force-sensitive resistors, an MPU-9250-class IMU, and a 16×2 LCD status interface, then publishes IMU and force-voltage telemetry through micro-ROS over USB serial. The remaining open work for this card is the final packaging story: Jetson placement, cable routing, sensor mounting, and the exact mechanical integration of the same interfaces that are already present in software.</p>
</div>

<div class="t2-card" id="powersystem">
  <h2>Power System</h2>
  <p class="t2-sub">Bench-level control and communications wiring is now represented in the implementation media, but the final robot power-distribution writeup is still pending.</p>
  <p>The current embedded code and circuit photos reflect low-level bench integration of the ESP32, IMU, LCD, and RS485 drive bus needed for bring-up and diagnostics. The full robot power architecture—battery, fusing, service disconnects, contactor behavior, and high-current harnessing—will be documented once the hardware bill of materials and as-built routing are frozen.</p>
</div>

<div class="t2-card" id="jetson">
  <h2>Jetson Deployment</h2>
  <p class="t2-sub">The Jetson-side implementation is now explicitly split between containerized ROS bring-up and host-native GPU vision code.</p>
  <p>The deployed ROS environment is centered on a <code>jazzy</code> container built from <code>ros:jazzy-ros-base</code>. That container installs Navigation2, <code>slam_toolbox</code>, <code>twist_mux</code>, <code>diagnostic_aggregator</code>, <code>xacro</code>, <code>robot_state_publisher</code>, and the micro-ROS message package, then bind-mounts the host ROS workspace and device tree into the container. A second <code>microros_agent</code> container runs alongside it and attaches to the ESP32 over <code>/dev/ttyUSB0</code> at 115200 baud.</p>

  <details class="t2-acc" open>
    <summary><h3>Container layout</h3></summary>
    <div class="t2-acc-body">
      <p>The compose file uses host networking, host IPC, and privileged mode so the ROS graph can access local devices without an additional transport shim. The Jetson-specific Python package path and <code>/proc/device-tree</code> are mounted read-only, while the full ROS workspace and <code>.ros</code> directory are mounted read-write for iterative development.</p>
      <p>This makes the container the main ROS bring-up environment rather than a sealed runtime image. New packages can be dropped into the bind-mounted workspace and rebuilt in place, which is useful on a platform that is still changing quickly during integration.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Entrypoint and preflight behavior</h3></summary>
    <div class="t2-acc-body">
      <p>The container entrypoint sources the ROS installation and the workspace overlay, opportunistically builds missing packages, and then conditionally starts the Jetson LCD status node and <code>twist_mux</code>. It also gates optional <code>slam_toolbox</code> and Nav2 startup behind a preflight check that waits for <code>/scan</code>, <code>/odom</code>, and the required odom-to-base TF edge.</p>
      <p>That preflight gate is important because it prevents the navigation stack from launching into an incomplete graph. In the current deployment model, the container can remain conservative by default while still being able to autostart mapping or navigation once the required upstream interfaces are available.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Why SLAM stays outside the container</h3></summary>
    <div class="t2-acc-body">
      <p>The ORB-SLAM2 RealSense RGB-D executable is intentionally kept on the Jetson host rather than inside the Jazzy container. That host-native path is where CUDA-enabled OpenCV, the RealSense SDK, and the patched SLAM fork live today, while the ROS-facing side remains containerized and easier to manage as a standard bring-up environment.</p>
      <p>The boundary between those layers is UDP rather than direct in-process ROS publication. This keeps the GPU-heavy SLAM runtime independent from the ROS container image while still letting the rest of the robot stack consume its outputs.</p>
    </div>
  </details>
</div>

<div class="t2-card" id="ros">
  <h2>Software Interface</h2>
  <p class="t2-sub">Current codebase status for the ROS 2 + MuJoCo + operator-interface boundary.</p>
  <p>The implemented software stack is now more than a simulation scaffold. It includes the MuJoCo bridge package, the PyQt operator station, the Jetson deployment container environment, and the interfaces needed for the embedded sensor bridge and future autonomy modules. Even so, the present system should still be understood as an integration and controller-development platform rather than a final autonomous field deployment.</p>

  <details class="t2-acc" open>
    <summary><h3>Nodes and Components</h3></summary>
    <div class="t2-acc-body">
      <ul>
        <li><code>mujoco_bridge_node</code> loads the selected MJCF scene, advances simulation, publishes odometry / TF / IMU / RGB-D outputs, publishes actuator torque telemetry, logs contact metrics, and optionally renders viewer overlays and a live debug plot.</li>
        <li><code>gait_phase_controller</code> is the present locomotion controller. It subscribes to commanded body motion, joint state feedback, IMU data, and per-leg contact state, then publishes joint velocity commands for the six actuated leg inputs.</li>
        <li><code>spec_task_planner</code> provides a task-level tracker for straight and constant-curvature arc tests. It generates the reference path, emits planner status/debug topics, and commands <code>/cmd_vel</code> to satisfy the current performance specification cases.</li>
        <li><code>cmd_vel_repeater</code> supports teleoperation by converting bursty keyboard input into a continuously republished <code>/cmd_vel</code> stream with a hold timeout and automatic zeroing.</li>
        <li><code>robot_state_publisher</code> is started from launch so the URDF-based TF tree is available to the rest of the ROS graph.</li>
        <li><code>controller_manager</code> and the <code>joint_state_broadcaster</code> / <code>leg_velocity_controller</code> spawners are already wired into launch, but are optional and only enabled when <code>use_ros2_control:=true</code>.</li>
        <li><code>ekf_node</code> from <code>robot_localization</code> is also already wired as an optional launch-time component for fused state estimation.</li>
        <li><code>hexapod_control_gui</code> is a separate ROS 2 operator-station package that provides a PyQt-based dashboard, live camera panes, topic-presence monitoring, and command publication for teleop, gait mode, rider state, and e-stop.</li>
        <li><code>esp32_sensor_bridge</code> is the current micro-ROS node name used by the ESP32 firmware when it comes online over the serial agent.</li>
      </ul>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Current command and feedback path</h3></summary>
    <div class="t2-acc-body">
      <p>The currently implemented teleoperation and control chain in simulation is:</p>
      <p><code>teleop_twist_keyboard → /cmd_vel_key → cmd_vel_repeater → /cmd_vel → gait_phase_controller → /topic_based_joint_commands → mujoco_bridge_node → MuJoCo actuators</code></p>
      <p>On the embedded side, the ESP32 already subscribes to <code>/cmd_vel</code> through micro-ROS and caches the linear / angular command pair, but the current firmware still treats that as a placeholder interface rather than a direct gait-output path. That means the ROS command contract is already shared across simulation and embedded bring-up even though the closed-loop gait controller still lives on the ROS side today.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Interface / topic contract</h3></summary>
    <div class="t2-acc-body">
      <p><strong>Primary motion input:</strong> the runtime stack expects <code>/cmd_vel</code> as the body-level velocity command used by teleoperation, the spec-task planner, and the current micro-ROS firmware subscriber.</p>
      <p><strong>Operator-side motion input:</strong> the control GUI publishes on <code>/cmd_vel_teleop</code> and can automatically select either <code>Twist</code> or <code>TwistStamped</code> to match the topic type already present on the graph.</p>
      <p><strong>Joint-level command path:</strong> the gait controller publishes <code>JointState</code> velocity commands on <code>/topic_based_joint_commands</code>, which the MuJoCo bridge consumes to drive the six velocity actuators.</p>
      <p><strong>Core state outputs:</strong> the bridge publishes <code>/odom</code>, <code>/tf</code>, <code>/imu/data</code>, and RGB-D outputs suitable for downstream visualization and state-estimation modules.</p>
      <p><strong>Perception outputs:</strong> RGB-D related outputs include color and depth camera info topics, aligned depth, and a point cloud on <code>/camera/depth/points</code>.</p>
      <p><strong>Embedded telemetry:</strong> the ESP32 publishes <code>/imu/data_raw</code> and <code>/force_sensor_voltage_millivolts</code>, where <code>ForceSensorVoltages.msg</code> is currently a fixed-size <code>int32[6]</code> payload in millivolts.</p>
      <p><strong>Locomotion diagnostics:</strong> the gait controller publishes <code>/gait_mode</code> and <code>/gait_phase_debug</code>; the bridge can also publish actuator torques and leg-contact diagnostics for debugging.</p>
      <p><strong>Operator / safety topics:</strong> the GUI also publishes <code>/mode/operation</code>, <code>/mode/rider_present</code>, and <code>/safety/e_stop</code>, and monitors a curated set of important ROS topics so the control PC can act as a system-status dashboard.</p>
      <p><strong>Planner diagnostics:</strong> the current task planner publishes <code>/spec_reference_path</code>, <code>/spec_task_status</code>, and <code>/spec_task_debug</code>, which are also consumed by the MuJoCo viewer overlay.</p>
    </div>
  </details>
</div>

<div class="t2-card" id="operatorui">
  <h2>Operator Interface</h2>
  <p class="t2-sub">A dedicated ROS 2 control-station GUI is now part of the implementation.</p>
  <p>The current software stack includes a separate <code>hexapod_control_gui</code> package for the operator-side laptop or control PC. It is implemented as a single-process PyQt5 application with a ROS 2 node embedded directly into the UI process, so the dashboard can both monitor the graph and publish commands without an additional bridge service.</p>

  <details class="t2-acc" open>
    <summary><h3>Live monitoring functions</h3></summary>
    <div class="t2-acc-body">
      <p>The GUI subscribes to battery state, odometry, IMU, diagnostics, color video, depth video, and—when available—the custom six-channel force-sensor topic. It also tracks the presence of important ROS topics such as camera feeds, <code>/odom</code>, <code>/tf</code>, controller command topics, and safety/mode topics so the operator gets a quick graph-health view instead of having to inspect everything from the terminal.</p>
      <p>Because the GUI includes optional <code>pyqtgraph</code> and <code>cv_bridge</code> integration, it is already capable of acting as both a status dashboard and a lightweight perception viewer during bring-up.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Command publication</h3></summary>
    <div class="t2-acc-body">
      <p>The GUI publishes operator commands for teleoperation, operation mode, rider-present state, e-stop, and gait-mode selection. Its teleop interface generates planar body commands and is explicitly written to cope with either <code>geometry_msgs/Twist</code> or <code>geometry_msgs/TwistStamped</code> on the selected command topic.</p>
      <p>This is useful because it lets the control-station software stay aligned with whichever command-message type is already present in the current ROS graph instead of forcing one fixed message type everywhere.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Launch integration</h3></summary>
    <div class="t2-acc-body">
      <p>The package includes its own launch entry point, <code>hexapod_control_gui.launch.py</code>, which loads a GUI defaults YAML file and starts the dashboard as a standalone ROS 2 node. That makes the operator interface deployable independently of the simulation package while still sharing the same topic contract.</p>
    </div>
  </details>
</div>

<div class="t2-card" id="localcontroller">
  <h2>Local Controller</h2>
  <p class="t2-sub">The implemented control path is currently split between a ROS-side gait controller and an embedded smoke-test drive layer.</p>
  <p>The present locomotion controller is still the ROS-based <code>gait_phase_controller</code>, which operates as a six-leg phase controller rather than a low-level motor-current loop. It accepts body-level linear and angular commands, chooses between stand / tripod / wave gait families, and computes joint velocity targets for the six actuated inputs. That controller is now paired with an offline MJX/JAX tuning workflow, so the software implementation includes both the online controller and the machinery used to optimize its gains.</p>

  <details class="t2-acc" open>
    <summary><h3>Implemented gait logic</h3></summary>
    <div class="t2-acc-body">
      <ul>
        <li>Tripod and wave templates are implemented, with automatic gait selection available based on commanded speed and turn curvature.</li>
        <li>A dedicated yaw cadence path is implemented, including curvature-aware turning gains, forward-speed reduction during turning, and yaw-rate feedback terms.</li>
        <li>Contact-state debouncing, contact-phase logging, touchdown / liftoff event logging, and same-side rejection logic are already present to improve gait coherence during turning and support transitions.</li>
        <li>The controller publishes both a discrete gait mode and a richer debug topic so that the live plotter and analysis tooling can reconstruct the controller state over time.</li>
      </ul>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Embedded bring-up controller path</h3></summary>
    <div class="t2-acc-body">
      <p>On the ESP32, the current drive-facing code is deliberately narrower. The firmware already brings up a shared RS485 Modbus master for six DSY-RS servos, polls basic telemetry, and exposes a fixed-size micro-ROS smoke-test interface for typed parameter reads / writes and basic command experiments. That path is for actuator communication verification and raw register-level bring-up, not yet for closed-loop leg gait generation on the MCU.</p>
      <p>This split is intentional: the robot already has a working gait/controller-development stack in ROS, while the embedded layer is being built up as a reliable sensing and drive-communications substrate underneath it.</p>
    </div>
  </details>
</div>

<div class="t2-card" id="training">
  <h2>MJX Controller Tuning</h2>
  <p class="t2-sub">The implementation includes offline optimization code for structured gait and planner tuning.</p>
  <p>In addition to the runtime ROS 2 nodes, the project includes MuJoCo MJX + JAX training scripts that tune the existing structured controller rather than replacing it with a black-box policy. This matters because the tuning workflow is tied directly to the deployed gait-controller parameters and the formal straight / curvilinear performance tasks.</p>

  <details class="t2-acc" open>
    <summary><h3>Base trainer</h3></summary>
    <div class="t2-acc-body">
      <p><code>hexapod_mjx_cpg_tune_colab_cache_mem.py</code> is the base batch tuner. It runs batched MJX rollouts under JAX, includes GPU-memory bootstrap logic for Colab or local accelerators, and optimizes a structured phase-based controller with a fixed gait template using population-based search. In the current checked-in version, that base script uses Cross-Entropy Method style optimization and is designed around controller-gain tuning rather than raw trajectory learning.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Exact-reference spec-task trainer</h3></summary>
    <div class="t2-acc-body">
      <p><code>hexapod_mjx_spec_exact_train_eval_bidirectional_recovery_cmaes.py</code> wraps the base tuner with the exact analytic reference geometry used by the performance spec. It supports the four formal task families, plus mixed and alternating bidirectional curvilinear cases, and can either train or evaluate parameter sets against those references.</p>
      <p>The current version supports both CEM and diagonal CMA-ES style optimization, can export tuned parameters as YAML for the runtime controller stack, writes the latent parameter vector to <code>.npy</code>, and supports startup-keyframe configuration, evaluation-only runs, rendering, and resume workflows.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>What gets tuned</h3></summary>
    <div class="t2-acc-body">
      <p>The optimization targets are not arbitrary neural-network weights. The scripts explicitly tune interpretable controller parameters such as cadence gains, phase gains, yaw/curvature response, stability bias, and curve-overshoot behavior. The training script can emit YAML blocks for both <code>gait_phase_controller</code> and <code>spec_task_planner</code>, which closes the loop between offline search and runtime ROS 2 deployment.</p>
    </div>
  </details>
</div>

<div class="t2-card" id="slam">
  <h2>SLAM</h2>
  <p class="t2-sub">SLAM is no longer only a future target; there is now a concrete host-side RGB-D runtime path for the Jetson.</p>
  <p>The current SLAM implementation centers on a patched ORB-SLAM2 RealSense RGB-D entry point that runs natively on the Jetson outside the Jazzy container. This keeps CUDA-enabled OpenCV, librealsense, and the patched ORB-SLAM2 fork on the host where GPU bring-up is currently easiest, while the ROS-facing software stack remains containerized and easier to manage.</p>

  <details class="t2-acc" open>
    <summary><h3>Host-native ORB-SLAM2 wrapper</h3></summary>
    <div class="t2-acc-body">
      <p>The patched <code>rgbd_real_sense</code> wrapper is an RGB-D executable that acquires synchronized color and depth frames from RealSense, feeds them into ORB-SLAM2, and keeps the RealSense-specific runtime logic near the SLAM process itself. In the current source it defaults to a 640×480, 30&nbsp;Hz RGB-D stream and supports an interactive visualization toggle plus configurable runtime duration.</p>
      <p>This is a practical deployment choice for the Jetson because it avoids having to containerize the full GPU/driver/RealSense stack before the perception path is stable.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>UDP bridge contract</h3></summary>
    <div class="t2-acc-body">
      <p>Instead of publishing ROS messages directly, the wrapper emits packed UDP messages. The primary packet stream uses the <code>OS2P</code> magic header and carries sequence ID, wall-clock timestamp, translation, quaternion orientation, and a tracking-valid flag. By default it targets <code>127.0.0.1:5005</code>, with enable / IP / port set through environment variables.</p>
      <p>The same executable can also emit an optional virtual scan packet stream with the <code>OS2S</code> header. That scan is synthesized from the depth image itself, which lets the ROS-side deployment avoid a separate <code>realsense_ros + depthimage_to_laserscan</code> chain during bring-up.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Current integration role</h3></summary>
    <div class="t2-acc-body">
      <p>At the moment, this SLAM path should be viewed as a concrete perception bridge into the ROS stack rather than a finished autonomy subsystem. It provides the host-native GPU runtime and the inter-process transport boundary needed to carry pose and optional scan information into the rest of the robot software.</p>
      <p>That is already enough to make the implementation story materially stronger: the site can now describe a real Jetson-native SLAM execution path instead of only a generic future plan to “add SLAM later.”</p>
    </div>
  </details>
</div>

<div class="t2-card" id="esp32">
  <h2>ESP32 Firmware</h2>
  <p class="t2-sub">The embedded side now has a concrete ESP-IDF and micro-ROS implementation, even though full gait actuation is still a follow-on step.</p>
  <p>The current ESP32 project is an ESP-IDF firmware package that launches dedicated tasks for force-sensor acquisition, IMU acquisition, RS485 servo polling, LCD status output, and a reconnecting micro-ROS session over the onboard USB-UART bridge. In other words, the MCU side is no longer just an interface concept: it already has working code for sensing, operator feedback, and bench actuator communication.</p>

  <details class="t2-acc" open>
    <summary><h3>Firmware task structure</h3></summary>
    <div class="t2-acc-body">
      <p><code>app_main()</code> brings up the custom micro-ROS UART transport, starts the force-sensor ADC task, the MPU-9250 task, the DSY RS485 servo polling task, the LCD status task, and then the main micro-ROS task. Before the XRCE session starts, firmware logging is silenced so the same UART0 link can be used for binary micro-ROS transport.</p>
      <p>The micro-ROS task itself is written as a reconnecting session loop. It pings the agent, initializes publishers / subscribers / timer / executor when the link is up, and tears everything back down cleanly if the session fails so it can retry later.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Sensor interfaces implemented today</h3></summary>
    <div class="t2-acc-body">
      <ul>
        <li><strong>Force sensors:</strong> six FSR channels on GPIO36, GPIO39, GPIO34, GPIO35, GPIO32, and GPIO33 using the ESP32 ADC continuous driver, cached in both raw counts and millivolts.</li>
        <li><strong>IMU:</strong> an MPU-9250 / MPU-6500-compatible path on <code>I2C_NUM_0</code> with SCL on GPIO21, SDA on GPIO22, and interrupt input on GPIO23.</li>
        <li><strong>LCD:</strong> a 16×2 HD44780-compatible display in 4-bit mode with RS on GPIO25, E on GPIO26, and data lines on GPIO27, GPIO14, GPIO12, and GPIO13.</li>
      </ul>
      <p>The firmware currently publishes <code>sensor_msgs/Imu</code> on <code>/imu/data_raw</code> and <code>ForceSensorVoltages</code> on <code>/force_sensor_voltage_millivolts</code> every 50&nbsp;ms, so the ROS graph already sees the sensor bridge as a real runtime component.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>micro-ROS transport and status UI</h3></summary>
    <div class="t2-acc-body">
      <p>The current transport is a custom UART-backed micro-ROS transport on <code>UART_NUM_0</code> at 115200 baud, intended to use the ESP32 dev board’s onboard USB-UART bridge. The firmware subscribes to <code>/cmd_vel</code>, caches the latest linear and angular command pair locally, and exposes its current session health on the LCD.</p>
      <p>The LCD rotates through sensor values and shows compact runtime fields such as agent reachability, entity initialization state, publish count, active force-sensor index, millivolt reading, and a cached error code. That makes the board self-describing during bring-up even without a laptop terminal open.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>RS485 servo path and smoke-test layer</h3></summary>
    <div class="t2-acc-body">
      <p>The servo driver is implemented as a shared RS485 Modbus RTU master on <code>UART_NUM_2</code> with TX on GPIO17 and RX on GPIO16. It is configured for six DSY-RS slave addresses, polls basic telemetry in the background, and caches bus voltage, current, position, deviation, and status-word information for each drive.</p>
      <p>On top of that bus layer, <code>six_motor_control.c</code> implements a fixed-size micro-ROS smoke-test interface for raw parameter reads / writes and basic command experiments, including conservative default speed limits. This is explicitly a bench bring-up path rather than the final embedded gait layer, but it materially de-risks communications with all six drives.</p>
    </div>
  </details>
</div>

<div class="t2-card" id="simulation">
  <h2>Simulation</h2>
  <p class="t2-sub">This remains the most mature subsystem, and it now forms the reference side of the broader deployment stack.</p>
  <p>The simulator is built around MuJoCo with a ROS 2 Jazzy interface layer. It already captures the six-input Klann-based plant, publishes simulated sensing products, supports multiple scene variants, and includes dedicated tooling for locomotion debugging and spec-driven path tracking. Just as importantly, the simulation topic contract now mirrors the interfaces used by the Jetson operator GUI, the MJX training pipeline, and the ESP32 sensor bridge.</p>

  <details class="t2-acc" open>
    <summary><h3>Plant model</h3></summary>
    <div class="t2-acc-body">
      <p>The core robot model uses a free-floating body named <code>base_link</code> with a dedicated sensor head carrying the IMU site and the forward-facing <code>rgbd_cam</code>. Six velocity actuators are currently exposed at the leg inputs <code>fl_rightdown</code>, <code>fr_rightdown</code>, <code>lm_rightdown</code>, <code>rm_rightdown</code>, <code>bl_rightdown</code>, and <code>br_rightdown</code>.</p>
      <p>The current checked-in robot XML also reflects ongoing collision simplification work: the visual meshes remain, but the base now includes a simplified top collision box on <code>base_link</code> while preserving selected linkage collision geometry where it matters for contact behavior. Torque sensors are attached to each actuated joint, enabling torque logging, moving-window RMS metrics, and controller/debug plots. The base scene uses a 1&nbsp;ms MuJoCo timestep and a Newton solver, which is consistent with its role as a dynamics and controller-development environment.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Scene variants implemented today</h3></summary>
    <div class="t2-acc-body">
      <ul>
        <li><strong>Default scene:</strong> a compact room with floor, walls, and obstacle crates for baseline locomotion and sensor bring-up.</li>
        <li><strong>Drop-box scene:</strong> the same base room plus a free-moving box body named <code>drop_box</code>, used for payload or disturbance-style tests.</li>
        <li><strong>Payload / rider scene:</strong> the retained <code>scene_humanoid.xml</code> entry point now attaches an equivalent-mass payload model to the robot. In the current checked-in version that payload is represented by a same-mass cube with bottom-face-only collision, which is more appropriate for controlled payload-contact testing than a full articulated rider body.</li>
      </ul>
      <p>The launch layer already selects among these with <code>scene_variant:=default</code>, <code>scene_variant:=rider</code>, or <code>scene_variant:=drop_box</code>, while still allowing direct XML override through <code>model_path:=...</code>.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Perception and state outputs</h3></summary>
    <div class="t2-acc-body">
      <p>The bridge currently publishes a D415-like RGB-D sensor configuration at <code>1280×720</code> with a <code>40°</code> vertical field of view, depth quantization, configurable depth noise, and edge dropout effects to better approximate a real depth stream.</p>
      <ul>
        <li>odometry and TF for robot-state consumers,</li>
        <li>IMU data,</li>
        <li>camera info topics for color and depth,</li>
        <li>aligned depth images,</li>
        <li>and a point cloud on <code>/camera/depth/points</code>.</li>
      </ul>
      <p>This is the same forward-facing sensing contract that the control GUI and the Jetson-side SLAM path are built around.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Locomotion and contact instrumentation</h3></summary>
    <div class="t2-acc-body">
      <p>The simulator computes and exposes more than just body motion. The bridge publishes actuator torques and per-leg contact metrics, while the gait controller can log contact-phase histograms and contact events to CSV. Contact state is debounced and used directly inside the gait logic to improve gait selection and reject unstable same-side support patterns.</p>
      <p>The bridge also contains support-body detection heuristics for the support assembly, per-support-unit load/contact accounting, and a torque logging path that records body motion and support-load statistics alongside joint torques.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Spec-task planner and debugging tooling</h3></summary>
    <div class="t2-acc-body">
      <p>The current task-level planner is a specification-task tracker used to evaluate whether the robot can satisfy the required straight and curvilinear performance tests. It uses an exact geometric line/arc tracker rather than a sampled nearest-point approximation, supports forward/backward straight and forward/backward curvilinear modes, and publishes the corresponding reference path for visualization.</p>
      <p>The MuJoCo viewer has already been extended beyond raw plant visualization. It can render dense reference-path markers, a goal-tolerance ring, and a planner-phase overlay whose color and glyphs change depending on whether the robot is waiting, tracking straight, turning left, turning right, approaching the goal, succeeding, or timing out. A separate multiprocessing live-plot window can stream filtered contact state, contact count, normal force, torque, gait phase, gait mode, and commanded body motion in real time.</p>
    </div>
  </details>

  <details class="t2-acc">
    <summary><h3>Current launch entry points</h3></summary>
    <div class="t2-acc-body">
      <ul>
        <li><code>sim_nav.launch.py</code> starts the MuJoCo bridge and optional ROS control / EKF infrastructure.</li>
        <li><code>spec_task_nav.launch.py</code> layers the gait controller and exact spec-task planner on top of the base simulation launch.</li>
        <li><code>gait_phase_controller.launch.py</code> exposes the locomotion controller and its contact-logging parameters as a standalone launch entry point.</li>
        <li><code>teleop_testing.launch.py</code> launches keyboard teleoperation together with the <code>cmd_vel</code> repeater for manual motion tests.</li>
        <li><code>hexapod_control_gui.launch.py</code> launches the standalone operator GUI for control-station monitoring and command publication.</li>
      </ul>
      <p>Together, these launches already provide a practical workflow for manual testing, controller tuning, and performance-case evaluation entirely inside the simulation environment.</p>
    </div>
  </details>
</div>
