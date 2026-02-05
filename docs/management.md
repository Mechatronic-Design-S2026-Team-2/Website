---
title: "Project Management"
---

{% include nav.html %}

<link rel="stylesheet" href="{{ '/assets/css/pm-widget.css' | relative_url }}">

## Parts list / budget
- Link: [Parts & Budget (CSV)](project_management/parts_list.csv)

<div id="pmWidget" class="pm-widget" data-status-json="{{ '/assets/data/status.json' | relative_url }}">
  ## Schedule
  {% include pm-schedule.html %}

  ## Issues log (design changes)
  {% include pm-issues-log.html %}
</div>

## Presenter rotation
- Sensor Lab: Daniel
- Motors Lab: Daniel
- System Demo 1:
- System Demo 2:
- System Demo 3:
- System Demo 4:
- System Demo 5:
- System Demo 6:
- System Demo 7:
- Final System Demo:
- Final System Demo Encore:

## Meeting notes / decisions

<script defer src="{{ '/assets/js/render-management.js' | relative_url }}"></script>
