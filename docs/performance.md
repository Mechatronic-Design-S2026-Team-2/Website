---
title: "System Performance"
---

{% include nav.html %}
{% include page-assets.html cards=true media_gallery=true model_viewer=true %}

<div class="t2-card">
  <h2>System Performance</h2>
  <p class="t2-sub">Performance page scope: measured class-final outcomes, evidence media, calibration status, and remaining limits. Architecture and package details are intentionally kept on the Design and Implementation pages.</p>
  <p>
    The final class system met the central feasibility goals: it carried rider-scale payloads, produced body-displacing legged locomotion, operated quietly, and demonstrated odometry/navigation behavior at the required order of accuracy. These results validate the approach for the class project, but they are not yet production-stage certification for performance use.
  </p>
  <div class="t2-metric-grid">
    <div class="t2-metric"><b>Payload</b><span>&gt;200 lb supported/transported without structural failure</span></div>
    <div class="t2-metric"><b>Unloaded speed</b><span>~0.7 m/s forward/backward</span></div>
    <div class="t2-metric"><b>Human-payload speed</b><span>~0.44 m/s with rider</span></div>
    <div class="t2-metric"><b>Navigation tolerance</b><span>6 in target achieved in straight-line odometry/navigation tests after calibration</span></div>
  </div>
</div>

<div class="t2-card" id="motion-evidence">
  <h2>Motion Evidence</h2>
  <p>
    The final-run animations should be embedded here rather than left only on the Media page. They provide visual evidence for the main performance claims: all-leg actuation, outdoor locomotion, and body-displacing gait behavior.
  </p>
  <div class="media-row">
    <div class="media-row-copy">
      <h3>Outdoor walking</h3>
      <p>
        <code>walking_outside.webm</code> is the primary final locomotion media. Use it for the clearest demonstration that the robot produces real body displacement through the Klann legs rather than only bench or suspended motion.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="videos" index=1 layout="wide" %}
    </div>
  </div>
  <div class="media-row media-row--reverse">
    <div class="media-row-copy">
      <h3>Unloaded all-leg actuation</h3>
      <p>
        <code>unloaded_all_legs_motion.webm</code> belongs beside the actuation result because it isolates drive synchronization, linkage motion, and phase behavior before rider/load effects are added.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="videos" index=0 layout="wide" %}
    </div>
  </div>
</div>

<div class="t2-card" id="requirements">
  <h2>Requirements Compliance</h2>
  <div class="t2-table-wrap">
    <table class="t2-table">
      <thead>
        <tr><th>Requirement</th><th>Metric</th><th>Test method</th><th>Result</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td>Leg-initiated locomotion</td><td>Robot body displacement from Klann legs</td><td>Physical walking tests</td><td>Final robot achieved forward/backward body-displacing locomotion.</td><td>Pass</td></tr>
        <tr><td>Carry rider-scale payload</td><td>170 lb required; 150 lb demo payload</td><td>Loaded physical tests</td><td>Transported payloads exceeding 170 lb; final report notes stable operation beyond 200 lb.</td><td>Pass</td></tr>
        <tr><td>Navigation/odometry tolerance</td><td>Reach designated point within 6 in</td><td>Tape-measured calibration and teleop/odometry trials</td><td>After final sign, mirror, and scale corrections, straight-line odometry was within tolerance.</td><td>Pass for straight-line class-final tests</td></tr>
        <tr><td>Speed/time feasibility</td><td>10 ft course within task time windows</td><td>Measured locomotion speed</td><td>~0.7 m/s unloaded and ~0.44 m/s with rider, sufficient for 10 ft tasks if controlled.</td><td>Pass</td></tr>
        <tr><td>Onboard compute</td><td>No laptop in final machine</td><td>Jetson Nano + ESP32 deployment</td><td>Jetson runs host SLAM and containerized ROS; ESP32 handles power/motor control.</td><td>Pass</td></tr>
        <tr><td>Mapping and waypoint support</td><td>Occupancy grid and Nav2 goal path</td><td>D415 + ORB-SLAM2 + virtual scan + slam_toolbox</td><td>ROS stack produces map/odom/scan products and operator map interface for goal placement.</td><td>Partial/pass for class-final integration</td></tr>
        <tr><td>Runtime</td><td>30 minutes onboard power</td><td>Battery operation during testing</td><td>52 V 25 Ah pack supported extended multi-session testing according to the final report.</td><td>Pass qualitatively; longer instrumented endurance test recommended</td></tr>
        <tr><td>Impact/drop robustness</td><td>25 lb dropped from 5 ft</td><td>Formal drop test</td><td>Not performed.</td><td>Not verified</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="t2-card" id="odometry-mapping-results">
  <h2>Odometry and Mapping Results</h2>
  <p>
    The strongest software result is that encoder-plus-linkage odometry became useful enough to meet the class navigation tolerance after calibration. The host observer unwraps raw 17-bit single-turn motor encoder counts, converts them through the 50:1 gearbox to output crank phase, evaluates measured Klann geometry, and solves a stance-foot no-slip least-squares body twist.
  </p>
  <div class="media-row">
    <div class="media-row-copy">
      <h3>Map and robot-state evidence</h3>
      <p>
        The RViz image and ORB-SLAM animation should be used as evidence of integrated mapping, not as generic software art. They show whether the sparse ORB map, occupancy map, virtual scan, and robot skeleton are aligned in a single planar frame tree.
      </p>
    </div>
    <div class="media-row-asset">
      {% include asset-item.html key="software_visuals" index=0 layout="wide" %}
    </div>
  </div>
  <p>
    In the final mapping report, a 73 in physical straight-line trial initially produced about 0.851 m of uncalibrated kinematic forward motion. The final configuration applies a kinematic mirror and a body-twist scale of 2.1786 in x/y. A separate ORB/scan scale calibration is applied consistently to ORB pose, sparse points, and virtual scan ranges.
  </p>
  <p class="t2-note">
    These values are empirical calibration parameters, not universal constants. Additional forward, reverse, yaw, payload, and stage-surface trials are required before the odometry model should be treated as production-calibrated.
  </p>
</div>

<div class="t2-card" id="remaining-limits">
  <h2>Known Limitations</h2>
  <ul>
    <li>RS485 throughput constrains control rate and encoder polling. Higher RPM increases single-turn wrap ambiguity.</li>
    <li>FSR foot-contact signals were not yet reliable enough to gate odometry; phase-derived stance confidence is used instead.</li>
    <li>Foot slip and surface compliance can bias no-slip kinematic odometry.</li>
    <li>ORB-SLAM2 CUDA is useful but remains a constrained Jetson deployment requiring process supervision and fallback odometry.</li>
    <li>Auxiliary support elements remain part of the final physical stability strategy; the platform is not yet a purely leg-only load-bearing walker under all conditions.</li>
    <li>Stage deployment still requires longer reliability trials, calibrated stopping behavior, lighting/occlusion tests, and rehearsal-specific maps.</li>
  </ul>
</div>
