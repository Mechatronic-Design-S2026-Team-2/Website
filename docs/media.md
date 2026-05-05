---
title: "Media"
---

{% include nav.html %}
{% include page-assets.html cards=true media_gallery=true model_viewer=true %}

<div class="t2-card">
  <h2>Media</h2>
  <p>
    This page collects final build, fabrication, electrical integration, software visualization, CAD/modeling, and robot-motion media. WebM clips are presented as silent looping animations.
  </p>
  
</div>

<div class="t2-card">
  {% include asset-gallery.html key="team_picture" %}
</div>

<div class="t2-card">
  {% include asset-gallery.html key="build_photos" %}
</div>

<div class="t2-card">
  {% include asset-gallery.html key="fabrication" %}
</div>

<div class="t2-card">
  {% include asset-gallery.html key="circuit_photos" %}
</div>

<div class="t2-card">
  {% include asset-gallery.html key="software_visuals" %}
</div>

<div class="t2-card">
  {% include asset-gallery.html key="videos" %}
</div>

<div class="t2-card">
  <h2>DWG and 3D model handling</h2>
  <p>
    GLB files are embedded directly with <code>&lt;model-viewer&gt;</code>. The final linkage and full-assembly models appear alongside the Desmos geometry model and the downloadable DWG schematic.
  </p>
  <p>
    DWG files are different: GitHub Pages does not provide a native DWG renderer. The clean static-site workflow is to store <code>linkage_schematic.dwg</code> under <code>docs/assets/designs/</code> as a download and export a PDF/SVG/PNG preview beside it for inline display. A PDF export is best for drawings that need dimensions and print fidelity; SVG/PNG is best for fast web preview.
  </p>
  <p>
    The Desmos 3D model is embedded as an iframe in the modeling gallery. The card also includes an external fallback link in case a browser blocks third-party iframe rendering.
  </p>
</div>
