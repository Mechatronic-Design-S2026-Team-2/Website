---
title: "Motors/Sensors Lab"
---

{% include nav.html %}

<link rel="stylesheet" href="{{ '/assets/css/cards.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/carousel.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/lab.css' | relative_url }}">

<div class="t2-card">
  <h2>Lab highlights</h2>
  <div class="t2-sub">Photos + a quick clip from our Motors/Sensors Lab work (placeholders for now).</div>

  {% include lab-carousel.html %}
</div>

<div class="t2-card">
  <h2>KiCad schematic</h2>
  <div class="t2-sub">
    Interactive viewer. KiCad file is in this repo under <code>docs/assets/designs/sensor_motor_lab/</code>.
  </div>

  {% include kicad-embed.html
     repo="Mechatronic-Design-S2026-Team-2/Website"
     ref="main"
     path="docs/assets/designs/sensor_motor_lab/18758sensor.kicad_sch"
  %}
</div>

<div class="t2-card">
  <h2>Bring-up notes</h2>
  <div class="t2-sub">Commands / logs (console-style) for flashing + testing.</div>

  {% include repo-button.html
     url="https://github.com/Mechatronic-Design-S2026-Team-2/Website/tree/main/docs/assets/designs/sensor_motor_lab"
     label="Open lab folder"
  %}

  <pre class="console"><code># Example: ESP32 serial monitor (adjust port)
idf.py -p /dev/ttyUSB0 flash monitor

# Example: sanity checks
# - Verify IMU responds on I2C
# - Verify ultrasonic reads stable distances
# - Verify encoder ticks increment in correct direction
  </code></pre>
</div>

<div class="t2-card" id="ilrs">
  <h2>ILRs</h2>
  <div class="t2-sub">In-lab reports (PDFs). Expand each dropdown to view.</div>

  {% include ilr-dropdowns.html %}
</div>

<script src="{{ '/assets/js/carousel.js' | relative_url }}" defer></script>
