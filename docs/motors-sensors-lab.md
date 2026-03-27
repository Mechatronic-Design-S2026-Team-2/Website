---
title: "Motors/Sensors Lab"
---

{% include nav.html %}
{% include page-assets.html cards=true carousel=true lab=true codebox=true %}

<div class="t2-card">
  <h2>Lab highlights</h2>

  {% include lab-carousel.html %}
</div>

<div class="t2-card">
  <h2>KiCad schematic</h2>
  {% include kicad-embed.html
     wrap="false"
     repo="Mechatronic-Design-S2026-Team-2/Website"
     ref="main"
     path="docs/assets/designs/sensor_motor_lab/18578sensor.kicad_sch"
  %}
</div>

<div class="t2-card">
  <h2>Mainfile</h2>

  {% include repo-button.html
   label="Sensors/Motors Lab repo"
   href="https://github.com/Mechatronic-Design-S2026-Team-2/Sensors-Motors-Lab" %}

  {% include lab-code.html wrap="false" %}
</div>

<div class="t2-card" id="ilrs">
  <h2>ILRs</h2>
  <div class="t2-sub">In-lab reports (PDFs). Expand each dropdown to view.</div>

  {% include ilr-dropdowns.html %}
</div>
