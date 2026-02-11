---
title: "Motors/Sensors Lab"
---

{% include nav.html %}

<link rel="stylesheet" href="{{ '/assets/css/cards.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/carousel.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/css/lab.css' | relative_url }}">

<div class="t2-card">
  <h2>Lab highlights</h2>

  {% include lab-carousel.html %}
</div>

<div class="t2-card">
  <h2>KiCad schematic</h2>

  {% include kicad-embed.html
     repo="Mechatronic-Design-S2026-Team-2/Website"
     ref="main"
     path="docs/assets/designs/sensor_motor_lab/18578sensor.kicad_sch"
  %}
</div>

<div class="t2-card">
  <h2>Mainfile</h2>

  {% include repo-button.html
     url="https://github.com/Mechatronic-Design-S2026-Team-2/Sensors-Motors-Lab"
     label="Open lab folder"
  %}

  {% include lab-code.html %}

</div>

<div class="t2-card" id="ilrs">
  <h2>ILRs</h2>
  <div class="t2-sub">In-lab reports (PDFs). Expand each dropdown to view.</div>

  {% include ilr-dropdowns.html %}
</div>

<script src="{{ '/assets/js/carousel.js' | relative_url }}" defer></script>
