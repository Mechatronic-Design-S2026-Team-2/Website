---
title: "Project Management"
---

{% include nav.html %}
{% include page-assets.html pm_widget=true %}

<div class="pm-widget" id="pmWidget" data-status-json="{{ '/assets/data/status.json' | relative_url }}">

  {% include pm-budget.html %}

  {% include pm-schedule.html %}

  {% include pm-issues-log.html %}

  {% include pm-presenters.html %}

  {% include pm-meetings.html %}

</div>
