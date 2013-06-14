<script id="uslider-template" type="text/template">
<div class="uslider-container clearfix {{ sliderClasses }}">

	{[ if(settings['controls_type'] == "arrows-simple") { ]}
	<div class="uslider-controls uslider-control-prev clearfix uslider-controls-{{ settings['controls_position'] }}" ><a href="#" title="Prev">Prev</a></div>
	{[ } else if(settings['controls_type'] == "dots" && settings['controls_position'] != 'bottom-out'){ ]}
	<ul class="uslider-controls uslider-pager clearfix  uslider-controls-{{ settings['controls_position'] }}"></ul>
	{[ } else if(settings['controls_type'] == "arrows-stacked" && settings['controls_position'] != 'bottom-left' && settings['controls_position'] != 'bottom-right'){ ]}
	<div class="uslider-controls clearfix uslider-controls-{{ settings['controls_position'] }}">
		<div class="uslider-control uslider-control-prev"><a href="#" title="Prev">Prev</a></div>
		<div class="uslider-control uslider-control-next"><a href="#" title="Next">Next</a></div>
	</div>
	{[ }]}
	<div class="uslider-preslide-caption uslider-caption">
	</div>
	<div class="uslider-slides">
		{[ for(var i=0; i<slidesLength; i++){ var slide = slides[i]; ]}
			<div class="uslider-slide-item" rel="{{ i }}">
				<div class="uslider-slide-image">
					{[ if(slide['link']){ ]}
					<a href="{{ slide['link'] }}">
					{[ } ]}
					<img src="{{ slide['images']['full']['url'] }}" alt="{{ slide['title'] }}">
					{[ if(slide['link']){ ]}
					</a>
					{[ } ]}
				</div>
			</div>
		{[ } ]}
	</div>

	{[ if(settings['controls_type'] == "arrows-simple") { ]}
	<div class="uslider-controls uslider-control-next clearfix uslider-controls-{{ settings['controls_position'] }}"><a href="#" title="Next">Next</a></div>
	{[ } else if(settings['controls_type'] == "arrows-stacked" && (settings['controls_position'] == 'bottom-left' || settings['controls_position'] == 'bottom-right')){ ]}
	<div class="uslider-controls clearfix uslider-controls-{{ settings['controls_position'] }}">
		<div class="uslider-control uslider-control-prev"><a href="#" title="Prev">Prev</a></div>
		<div class="uslider-control uslider-control-next"><a href="#" title="Next">Next</a></div>
	</div>
	{[ } else if(settings['controls_type'] == "dots" && settings['controls_position'] == 'bottom-out'){ ]}
	<ul class="uslider-controls uslider-pager clearfix uslider-controls-{{ settings['controls_position'] }}"></ul>
	{[ } else if(settings['controls_type'] == "thumbnails"){ ]}
		<ul class="uslider-controls uslider-pager uslider-thumbnails clearfix uslider-controls-{{ settings['controls_position'] }}"></ul>
	{[ } ]}

	<div class="uslider-postslide-caption uslider-caption">
	</div>

	{[ if(settings['desc_text'] == "yes"){ ]}
	<div class="uslider-texts">
		{[ for(var i=0; i<slidesLength; i++){ var slide = slides[i]; ]}
		<div class="uslider-slide-{{ i }}">
			<div class="uslider-slide-title">{{slide.title}}</div>
			<div class="uslider-slide-description">{{slide.description}}</div>
		</div>
		{[ } ]}
	</div>
	{[ } ]}
</div>
</script>