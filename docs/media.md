---
title: "Media"
---

{% include nav.html %}
{% include page-assets.html cards=true media_gallery=true model_viewer=true %}

<div class="t2-card">
  <h2>Media</h2>
  <p>
    This page is structured around the final build, fabrication, electrical integration, software visualization, and robot-motion media. The requested filenames are expected at the asset paths shown in each card; WebM files are treated as silent looping animations rather than conventional videos.
  </p>
  <p class="t2-note">
    All requested assets are now marked ready in <code>docs/_data/media_assets.yml</code> and <code>docs/_data/carousels.yml</code>. Duplicate requested filenames such as <code>building_chassis.jpg</code> and <code>front_final_cover.JPG</code> are represented once.
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
    GLB files can be embedded directly with <code>&lt;model-viewer&gt;</code>, which is already used by the site. Place <code>klann_final.glb</code> and <code>v5_final_assembly.glb</code> in <code>docs/assets/designs/</code> and set those gallery items to ready.
  </p>
  <p>
    DWG files are different: GitHub Pages does not provide a native DWG renderer. The clean static-site workflow is to store <code>linkage_schematic.dwg</code> under <code>docs/assets/designs/</code> as a download and export a PDF/SVG/PNG preview beside it for inline display. A PDF export is best for drawings that need dimensions and print fidelity; SVG/PNG is best for fast web preview.
  </p>
  <p>
    The Desmos 3D model is embedded as an iframe in the modeling gallery. The card also includes an external fallback link in case a browser blocks third-party iframe rendering.
  </p>
</div>
