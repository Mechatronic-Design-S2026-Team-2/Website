---
title: "Documents (Workbook)"
---

{% include nav.html %}
{% include page-assets.html cards=true %}

<div class="t2-card">
  <h2>Documents</h2>
  <p>
    Core reports and presentations are embedded here so the website can serve as a self-contained project workbook. The final report is the most accurate source for the as-built mechanical/electrical design and budget. The mapping report is the most detailed source for the Jetson/ESP32/RS485/kinematic-odometry software stack.
  </p>
</div>

{% include pdf-card.html
   title="Final Report"
   pdf="/assets/pdfs/final_report.pdf"
   subtitle="As-built class-final report: final design, system evaluation, budget, risks, and future work."
   height="82vh" %}

{% include pdf-card.html
   title="Resource-Constrained Odometry, Localization, and Mapping Report"
   pdf="/assets/pdfs/mapping_report.pdf"
   subtitle="Detailed software paper covering raw encoder timing, Klann kinematic odometry, ORB-SLAM2 CUDA, slam_toolbox, Nav2, and fusion."
   height="82vh" %}

{% include pdf-card.html
   title="Mapping Proposal"
   pdf="/assets/pdfs/Mapping_proposal.pdf"
   subtitle="Original staged plan for onboard odometry, localization, mapping, and embedded feasibility evaluation."
   height="72vh" %}

{% include pdf-card.html
   title="Design Proposal"
   pdf="/assets/pdfs/design-proposal.pdf"
   subtitle="Initial mechanical/electrical/software design proposal, retained for design history and trade-study context."
   height="72vh" %}

{% include pdf-card.html
   title="Design Proposal Presentation"
   pdf="/assets/pdfs/design-proposal-presentation.pdf"
   subtitle="Proposal slide deck."
   height="72vh" %}

{% include pdf-card.html
   title="Mapping Presentation"
   pdf="/assets/pdfs/mapping_presentation.pdf"
   subtitle="Localization and mapping presentation deck."
   height="72vh" %}

{% include pdf-card.html
   title="Midsemester Presentation"
   pdf="/assets/pdfs/midsemester_presentation.pdf"
   subtitle="Midsemester status and design evolution."
   height="72vh" %}

<div class="t2-card">
  <h2>Workbook folders</h2>
  <ul>
    <li><a href="documents/change_log.md">Change Log</a></li>
    <li><a href="documents/design_brainstorming/README.md">Design brainstorming</a></li>
    <li><a href="documents/drawings_schematics_datasheets/README.md">Drawings, schematics, datasheets</a></li>
    <li><a href="documents/tests/README.md">Component testing &amp; experiments</a></li>
    <li><a href="documents/software/README.md">Software</a></li>
    <li><a href="documents/presentations/README.md">Presentations</a></li>
    <li><a href="documents/ilrs/README.md">ILRs</a></li>
  </ul>
</div>
