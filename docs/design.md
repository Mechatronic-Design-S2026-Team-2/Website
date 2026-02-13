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
      <li><a href="#requirements">Requirements</a></li>
      <li><a href="#functional-architecture">Functional architecture</a></li>
      <li><a href="#trade-studies">Trade studies</a></li>
      <li><a href="#cyberphysical-architecture">Cyberphysical architecture</a></li>
      <li><a href="#mechanical">Mechanical design</a></li>
      <li><a href="#electrical">Electrical design</a></li>
      <li><a href="#software">Software & autonomy</a></li>
      <li><a href="#integration-testing">Integration & testing</a></li>
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

<!-- ====== Card: Requirements (collapsible) ====== -->
<div class="t2-card" id="requirements">
  <details class="t2-section" open>
    <summary><h2>Requirements</h2></summary>
    <p class="t2-note">
      Summary first; expand for details. (Keep these aligned to your current spec.)
    </p>
    <div class="t2-grid">
      <div class="t2-kv">
        <div><strong>Footprint:</strong> ≤ 5 ft × 5 ft</div>
        <div><strong>Ride height:</strong> 2–3 ft</div>
        <div><strong>Mass:</strong> ≤ 150 lb (robot)</div>
        <div><strong>Payload:</strong> up to 170 lb (demo tasks at 150 lb)</div>
      </div>
      <div class="t2-kv">
        <div><strong>Motion:</strong> forward/back + in-place rotation</div>
        <div><strong>Accuracy:</strong> 6 in within 1 minute</div>
        <div><strong>Power:</strong> ≥ 30 minutes</div>
        <div><strong>Noise:</strong> stage-appropriate (target ≤70 dB @ 5 ft)</div>
      </div>
    </div>
    <div class="t2-accordion">
      <details>
        <summary>Constraints & assumptions</summary>
        <div class="t2-acc-body">
          <ul>
            <li>Setup/packing constraints (modules, case size, assembly time).</li>
            <li>Safety constraints and E-stop behavior.</li>
            <li>Platform restrictions (no external laptop dependency in final run).</li>
          </ul>
        </div>
      </details>
      <details>
        <summary>Success criteria</summary>
        <div class="t2-acc-body">
          <ul>
            <li>Leg-initiated locomotion with repeatable, safe motion.</li>
            <li>Meets navigation tolerance requirement.</li>
            <li>Clean wiring, robust structure, performance-appropriate finish.</li>
          </ul>
        </div>
      </details>
    </div>
  </details>
</div>

<!-- ====== Card: Functional architecture (SVG embed directly) ====== -->
<div class="t2-card" id="functional-architecture">
  <h2>Functional architecture</h2>
  <p class="t2-note">Interactive, zoomable diagram (scroll to zoom, drag to pan).</p>
  {% include svg-diagram.html
    title="Functional architecture"
    svg="/assets/diagrams/functional-architecture.svg"
    source="/assets/diagrams/functional-architecture.drawio.xml"
    caption="Scroll to zoom • drag to pan • Fit/Reset controls"
  %}
</div>

<!-- ====== Card: Trade studies ====== -->
<div class="t2-card" id="trade-studies">
  <details class="t2-section" open>
    <summary><h2>Trade studies</h2></summary>
    <div class="t2-grid">
      <div>
        <h3>Locomotion concept</h3>
        <ul>
          <li><strong>Selected:</strong> mechanically encoded gait (Klann-style) for robustness under load.</li>
          <li><strong>Why:</strong> reduces IK/control risk and improves repeatability.</li>
        </ul>
      </div>
      <div>
        <h3>Drive motors</h3>
        <ul>
          <li><strong>Selected:</strong> DC gear motors + feedback (encoders) for accuracy.</li>
          <li><strong>Why:</strong> efficient for battery runtime; better for stage noise than steppers.</li>
        </ul>
      </div>
    </div>
    <div class="t2-grid">
      <div>
        <h3>Compute + sensing</h3>
        <ul>
          <li><strong>Selected:</strong> Jetson-class compute for perception.</li>
          <li><strong>Sensing:</strong> depth camera + IMU; refine per occlusions and lighting.</li>
        </ul>
      </div>
      <div>
        <h3>Side-leg actuation approach</h3>
        <ul>
          <li>Evaluate motor-driven vs linear actuation for force, controllability, packaging, and noise.</li>
          <li>Prototype early to lock geometry + mounting constraints.</li>
        </ul>
      </div>
    </div>
  </details>
</div>

<!-- ====== Card: Cyberphysical architecture (SVG embed) ====== -->
<div class="t2-card" id="cyberphysical-architecture">
  <h2>Cyberphysical architecture</h2>
  <p class="t2-note">Interactive, zoomable diagram. Hosted in-repo.</p>
  {% include svg-diagram.html
    title="Cyberphysical architecture"
    svg="/assets/diagrams/cyberphysical-architecture.svg"
    source="/assets/diagrams/cyberphysical-architecture.drawio.xml"
    caption="Scroll to zoom • drag to pan • Fit/Reset controls"
  %}
</div>

<!-- ====== Card: Mechanical design (GLB CAD embeds) ====== -->
<div class="t2-card" id="mechanical">
  <h2>Mechanical design</h2>
  {% include model-card.html
   title="Overall System Design (V1)"
   alt="v1 Hexapod Design"
   file="/assets/designs/hexapod-v1.glb"
   caption="Rotate/zoom to inspect." 
   force_gray="true" %}
   
  {% include model-card.html
   title="2-DOF Side Leg Subassembly"
   alt="2-DOF Side Leg Design"
   file="/assets/designs/articulated-leg.glb"
   caption="Rotate/zoom to inspect." 
   force_gray="true" %}

  {% include model-card.html
   title="Klann Leg Subassembly"
   alt="Klann Leg Design"
   file="/assets/designs/klann-leg.glb"
   caption="Rotate/zoom to inspect." 
   force_gray="true" %}
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

<!-- ====== Card: Integration & testing ====== -->
<div class="t2-card" id="integration-testing">
  <h2>Integration & testing</h2>
  <div class="t2-grid">
    <div>
      <h3>Staged testing</h3>
      <ul>
        <li>No-rider commissioning → dead weight → rider.</li>
        <li>Repeatable test scripts (noise, stop distance, accuracy).</li>
      </ul>
    </div>
    <div>
      <h3>Acceptance checks</h3>
      <ul>
        <li>6&quot; tolerance navigation benchmark.</li>
        <li>Battery runtime under representative load.</li>
        <li>Noise measurement at 5 ft and full load.</li>
      </ul>
    </div>
  </div>
</div>

<!-- ====== Card: Risks ====== -->
<div class="t2-card" id="risks">
  <h2>Risks & mitigations</h2>
  <ul>
    <li><strong>Actuation sizing / overheating:</strong> prototype under load; current limiting; thermal checks.</li>
    <li><strong>Stability / tip-over:</strong> low COM; validate support polygon margins; incremental loading.</li>
    <li><strong>Navigation error (slip/compliance):</strong> staged autonomy; logged tests; revise sensing.</li>
    <li><strong>Noise:</strong> smoother profiles; isolation; early measurement and redesign if needed.</li>
  </ul>
</div>
