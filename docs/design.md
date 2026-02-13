---
title: "System Design"
---

{% include nav.html %}

<link rel="stylesheet" href="{{ '/assets/css/cards.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/design.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/diagram.css' | relative_url }}">

<div class="t2-card">
  <h2>Design</h2>

  <div class="t2-toc">
    <div class="t2-toc-title">On this page</div>
    <ul class="t2-toc-list">
      <li><a href="#overview">Overview</a></li>
      <li><a href="#functional-architecture">Functional architecture</a></li>
      <li><a href="#trade-studies">Trade studies</a></li>
      <li><a href="#cyberphysical-architecture">Cyberphysical architecture</a></li>
      <li><a href="#mechanical">Mechanical design</a></li>
      <li><a href="#electrical">Electrical design</a></li>
      <li><a href="#software">Software & autonomy</a></li>
      <li><a href="#risks">Risks & mitigations</a></li>
    </ul>
  </div>

  <div class="t2-links" aria-label="Quick links">
    <a class="t2-linkbtn" href="{{ '/assets/pdfs/design-proposal.pdf' | relative_url }}" target="_blank" rel="noreferrer">
      Design proposal (PDF)
    </a>
  </div>
</div>

<!-- ====== Card: Overview ====== -->
<div class="t2-card" id="overview">
  <h2>Overview</h2>
  <p class="t2-note">
    High-level system concept: leg-initiated locomotion with robust load handling, safe operation around performers,
    and clean integration for a stage demo.
  </p>
  <div class="t2-grid">
    <div class="t2-kv">
      <div><strong>Locomotion:</strong> mechanically encoded gait (Klann-style) with differential-speed turning</div>
      <div><strong>Stability:</strong> side-leg subsystem for stabilization and expressive motion</div>
      <div><strong>Compute split:</strong> Jetson (perception/nav) + microcontroller (real-time motor/IO)</div>
    </div>
    <div class="t2-kv">
      <div><strong>Safety:</strong> E-stop, conservative dynamics, predictable behavior on stage</div>
      <div><strong>Portability:</strong> modular packing + fast assembly goals</div>
      <div><strong>Reliability:</strong> staged testing under representative load</div>
    </div>
  </div>
</div>

<!-- ====== Card: Functional architecture (SVG embed directly) ====== -->
<div class="t2-card" id="functional-architecture">
  <h2>Functional architecture</h2>
  {% include svg-diagram.html
    svg="/assets/diagrams/functional-architecture.svg"
    source="/assets/diagrams/functional-architecture.drawio.xml"
    caption="Scroll to zoom • drag to pan • Fit/Reset controls"
  %}
  <details class="t2-details">
    <summary>Description</summary>
    <p>
      The functional architecture decomposes the robot into mode/mission selection, status/diagnostics,
      estimation + scene interpretation, and a locomotion pipeline that synthesizes body motion commands
      into gait phase scheduling, foot placement/contact management, and leg actuation commands. Safety
      supervision (including E-stop handling) is treated as a cross-cutting path that can inhibit or clamp
      motion commands when hazards are detected, and power/energy management supports the 30-minute
      battery-life requirement.
    </p>
  </details>
</div>

<div class="t2-card" id="trade-studies">
  <h2>Design Trade Studies</h2>

  <details class="t2-details" open>
    <summary>Locomotion concept</summary>
    <p>
      We compared Klann vs Jansen vs articulated multi-DOF legs. Klann offers a mechanically encoded gait
      with fewer links/joints than Jansen and far less software/IK dependency than articulated legs, which reduces
      “software trip” risk and improves reliability under payload. It also provides better step clearance for taped-course
      reliability and obstacle tolerance.
    </p>
  </details>

  <details class="t2-details">
    <summary>Drive motor selection</summary>
    <p>
      We compared (1) high-torque DC gear motors, (2) smart servos (e.g., Dynamixel), and (3) steppers + gearbox.
      DC gear motors provide strong torque through high reduction at low cost, helping keep noise low at the walking-speed
      operating point. They also support efficiency targets for battery life, and can meet navigation tolerance when paired
      with external encoders.
    </p>
    <ul>
      <li><b>Key acceptance criteria:</b> stall torque margin in stance phase, noise at operating RPM, thermal rise over 30 min, and encoder resolution.</li>
      <li><b>Planned validation:</b> one-leg + crank bench test with current sensing + temperature logging and audible dB measurement at 5 ft.</li>
    </ul>
  </details>

  <details class="t2-details">
    <summary>Compute & sensing</summary>
    <p>
      We compared low-cost compute nodes for embedded autonomy and selected Jetson Nano primarily for CUDA acceleration
      to support depth processing with acceptable latency/power. Sensing is centered on a forward depth camera for obstacle
      detection/scene representation, with an IMU for short-horizon stabilization and disturbance detection, and an optional rear
      camera path to improve awareness during backing/turning.
    </p>
    <ul>
      <li><b>Key acceptance criteria:</b> end-to-end perception latency, worst-case power draw, and stability of outputs under stage lighting.</li>
      <li><b>Planned validation:</b> “walk in place” perception profiling + obstacle stop tests with a safety buffer threshold.</li>
    </ul>
  </details>
</div>

<!-- ====== Card: Cyberphysical architecture (SVG embed) ====== -->
<div class="t2-card" id="cyberphysical-architecture">
  <h2>Cyberphysical architecture</h2>
  <p class="t2-note">Interactive, zoomable diagram. Hosted in-repo.</p>
  {% include svg-diagram.html
    svg="/assets/diagrams/cyberphysical-architecture.svg"
    source="/assets/diagrams/cyberphysical-architecture.drawio.xml"
    caption="Scroll to zoom • drag to pan • Fit/Reset controls"
  %}
  <details class="t2-details">
    <summary>Description</summary>
    <p>
      The cyberphysical architecture splits “heavy” autonomy workloads (perception, mapping/localization,
      planning) onto an embedded compute node (Jetson), while timing-critical motor/encoder/contact I/O
      and deterministic gait control runs on one or more ESP32 microcontrollers. The operator station
      provides mode and mission inputs; onboard sensing (depth camera, optional rear camera, IMU) feeds
      state estimation and navigation; body-level velocity commands are sent to the ESP32 side, which
      closes low-level loops and returns odometry + gait state for fusion and telemetry.
    </p>
  </details>
</div>

<!-- ====== Card: Mechanical design (GLB CAD embeds) ====== -->
<div class="t2-card" id="cad-overall">
  <h2>CAD: Overall Assembly</h2>
  {% include model-card.html
   title="Overall System Design (V1)"
   alt="v1 Hexapod Design"
   file="/assets/designs/hexapod-v1.glb"
   caption="Rotate/zoom to inspect." 
   force_gray="true" %}
  <details class="t2-details">
    <summary>Description</summary>
    <p>
      The overall system is organized into four primary subsystems: a main base structure that supports the
      seated performer, a wheel support assembly to carry the majority of the system weight, a set of side
      legs for stabilization/lateral motion, and two sets of Klann-linkage-style leg assemblies for forward/
      backward locomotion. Electronics are packaged in a protected compartment between the base and wheel
      support to lower the center of gravity, improve mass distribution, and protect wiring/controls.
    </p>
  </details>
</div>

<div class="t2-card" id="cad-klann">
  <h2>CAD: Klann Linkage Assembly</h2>
  {% include model-card.html
   file="/assets/designs/klann-leg.glb"
   caption="Rotate/zoom to inspect." 
   force_gray="true" %}
  <details class="t2-details">
    <summary>Description</summary>
    <p>
      The Klann mechanism is selected to reduce actuator count while maintaining a mechanically encoded
      gait. Rotary DC gear motors drive the Klann crankshafts; each crankshaft is supported by bearings
      and standardized pivot hardware (shoulder bolts/joint pins, linkage plates, bushings/bearings, foot pads).
      One motor per side drives the corresponding leg set; forward/backward locomotion comes from the cyclic
      foot trajectory. Turning is implemented via a differential-drive strategy—independently controlling left/right
      leg-set speeds enables zero-radius turning about the vertical axis.
    </p>
  </details>
</div>

<div class="t2-card" id="cad-sidelegs">
  <h2>CAD: Side Legs Assembly</h2>
  {% include model-card.html
   file="/assets/designs/articulated-leg.glb"
   caption="Rotate/zoom to inspect." 
   force_gray="true" %}
  <details class="t2-details">
    <summary>Description</summary>
    <p>
      The side legs provide active stabilization, pose control, and controlled lateral (side-to-side) translation.
      They enlarge the support polygon to reduce tip risk under payload, help maintain the rider height target,
      enable controlled body roll/pitch for choreographed motion, and support lateral shifting (“side glide”) while
      staying within the 5’×5’ footprint. Each side leg is an articulated link assembly with an end foot pad, driven
      through a pinned joint/clevis interface. The baseline approach uses compact linear actuators (motor-internal)
      for simpler integration and precise position control, with a potential shift toward a motor-driven mechanism
      for cost/safety/integration reasons.
    </p>
  </details>
</div>

<!-- ====== Card: Electrical design ====== -->
<div class="t2-card" id="electrical">
  <details class="t2-section" open>
    <summary><h2>Electrical design</h2></summary>
    <p class="t2-note">
      Power distribution, motor drivers, sensing, safety interlocks, and harnessing strategy.
    </p>
    <ul>
      <li>Power budget + distribution topology (fusing, E-stop, safe-state).</li>
      <li>Motor drive selection per subsystem (main drive vs side legs).</li>
      <li>Connectorization and harnessing for modular breakdown.</li>
    </ul>
  </details>
</div>

<!-- ====== Card: Software & autonomy ====== -->
<div class="t2-card" id="software">
  <details class="t2-section" open>
    <summary><h2>Software & autonomy</h2></summary>
    <ul>
      <li>Mode control: manual / semi-auto / path-following.</li>
      <li>Estimation: IMU + encoder fusion; camera-derived cues as available.</li>
      <li>Safety supervisor: keep-out zone, stop conditions, watchdogs.</li>
    </ul>
  </details>
</div>

<!-- ====== Card: Risks ====== -->
<div class="t2-card" id="risks">
  <h2>Risks & Mitigations</h2>

  <details class="t2-details" open>
    <summary>R1 — Side leg size / geometry not finalized</summary>
    <p>
      Incorrect side-leg placement or length can cause mechanical interference, reduce stability under payload,
      or violate footprint/foldability constraints.
    </p>
    <ul>
      <li><b>Mitigation:</b> freeze a kinematic/packaging envelope early; run CAD interference checks across worst-case poses; lock geometry before releasing parts.</li>
      <li><b>Test:</b> check clearance and support polygon margin in CAD for extended/retracted/turning/folded configurations.</li>
    </ul>
  </details>

  <details class="t2-details">
    <summary>R2 — Side-leg actuation selection uncertainty</summary>
    <p>
      The side-leg actuation approach drives force capacity, controllability, noise, safety, and integration.
      Hydraulics are likely too complex/costly; pneumatics can struggle with stable position holding; current direction
      trends toward a motor-driven solution.
    </p>
    <ul>
      <li><b>Mitigation:</b> define minimum force/stroke/speed/noise targets; bench-test candidates; keep mounts modular to allow actuator swaps.</li>
      <li><b>Test:</b> load test to target force with position error spec + dB measurement; confirm safe failure mode (power-off behavior).</li>
    </ul>
  </details>

  <details class="t2-details">
    <summary>R3 — Materials and joint hardware not selected</summary>
    <p>
      Poor material or joint choices can cause buckling, backlash, and wear—reducing stability and safety.
    </p>
    <ul>
      <li><b>Mitigation:</b> standardize pivots with shoulder bolts/joint pins + bearings/bushings; do quick worst-load sanity checks prior to fabrication.</li>
      <li><b>Test:</b> single-link compression/bending sanity checks + pivot backlash measurement after assembly.</li>
    </ul>
  </details>

  <details class="t2-details">
    <summary>R4 — Late design decisions delay ordering and integration</summary>
    <ul>
      <li><b>Mitigation:</b> enforce a design-freeze milestone; order long-lead parts early; integrate in stages so locomotion and controls progress in parallel.</li>
      <li><b>Test:</b> weekly integration checklist with “minimum runnable system” gates (power → motor spin → gait timing → payload stand).</li>
    </ul>
  </details>

  <details class="t2-details">
    <summary>R5 — Budget creep from actuator/frame changes and rework</summary>
    <ul>
      <li><b>Mitigation:</b> maintain a live budget with contingency; favor off-the-shelf components; prototype uncertain subsystems cheaply before final hardware.</li>
      <li><b>Test:</b> bill-of-materials audit at each design freeze; track “cost to complete” vs remaining contingency.</li>
    </ul>
  </details>

  <div class="t2-muted" style="margin-top: 10px;">
    <a href="#top">Back to top</a>
  </div>
</div>
