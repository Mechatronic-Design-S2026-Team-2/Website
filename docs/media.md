---
title: "Media"
---

{% include nav.html %}
{% include page-assets.html cards=true media_gallery=true model_viewer=true %}

<div class="t2-card">
  <h2>Media</h2>
  <p>
    This page collects final build, fabrication, electrical integration, software visualization, simulation verification, CAD/modeling, and robot-motion media. WebM clips are presented as silent looping animations; the single-linkage MP4 is also rendered as an inline looping mechanism animation.
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
  {% include asset-gallery.html key="simulation_media" %}
</div>

<div class="t2-card">
  {% include asset-gallery.html key="videos" %}
</div>

<div class="t2-card">
  <h2>Fusion 360 CAD Embeds and Local Fallbacks</h2>
  <p>
    Fusion 360 embeds are the primary detailed CAD views for the schematic, final assembly, final Klann linkage, and later assembly iterations. Each card also exposes the local PDF or GLB fallback so the site still has a usable static artifact if Autodesk sharing is unavailable. Version 1 remains a local GLB viewer because no Fusion embed is configured for it.
  </p>
  <p class="t2-note">
    To force a local fallback, set <code>use_fallback: true</code> on that item in <code>docs/_data/media_assets.yml</code>. Leave it <code>false</code> to use the Fusion 360 iframe by default.
  </p>
  {% include asset-gallery.html key="fusion_cad" %}
</div>
