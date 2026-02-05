---
title: "Project Management"
---

{% include nav.html %}

<link rel="stylesheet" href="{{ '/assets/css/pm-widget.css' | relative_url }}">

<div class="pm-widget" id="pmWidget" data-status-json="{{ '/assets/data/status.json' | relative_url }}">

  {% include pm-budget.html %}

  {% include pm-schedule.html %}

  {% include pm-issues-log.html %}

  {% include pm-presenters.html %}

  {% include pm-meetings.html %}

</div>

<script defer src="{{ '/assets/js/render-management.js' | relative_url }}"></script>
