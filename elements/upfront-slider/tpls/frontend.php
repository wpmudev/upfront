<script id="uslider-template" type="text/template">
<div id="{{ sliderId }}" class="uslider-container {{ sliderClasses }}">

	{[ if(settings['controls_type'] == "arrows-simple") { ]}
	<div class="uslider-controls uslider-control-prev"><a href="#" class="uslider-control-prev" title="Prev">Prev</a></div>
	{[ } ]}

	<div class="uslider-slides">
		{[ for(i=0; slidesLength; i++){ slide = content.slides[content.order[i]]; ]}
			<div id="uslider-slide-item-{{ slide['id'] }}" class="uslider-slide-item" style="{{ slide['style'] }}">

				{[ if(settings['desc_text'] == 'yes' && (settings['layout'] == 'split' || settings['layout'] == 'split')) { ]}
				<div class="uslider-slide-title">{{ slide['title'] }}</div>
				{[ } ]}

				<div class="uslider-slide-image">
					{[ if(slide['links_to']){ ]}
					<a {{ slide['external'] }} href="{{ slide['links_to'] }}">
					{[ } ]}
					<img src="{{ slide['sizes']['full']['url'] }}" alt="{{ slide['title'] }}">
					{[ if(slide['links_to']){ ]}
					</a>
					{[ } ]}
				</div>

				{[ if(settings['controls_type'] && settings['controls_type'] == 'thumbnails'){ ]}
				<div class="uslider-slide-image-thumb" style="display:none">
					<img src="{{ slide['sizes']['thumbnail']['url'] }}" alt="{{ slide['title'] }}">					
				</div>
				{[ } ]}

				{[ if(settings['desc_text'] == "yes"){ ]}
				{[ if(settings['layout'] != 'split' && settings['layout'] != 'over'){ ]}
				<div class="uslider-slide-title">{{ slide['title'] }}</div>
				{[ } ]}
				<div class="uslider-slide-description">{{ slide['description'] }}</div>
				{[ } ]}
			</div>
		{[ } ]}
	</div>

	{[ if(settings['controls_type'] == "arrows-simple") { ]}
	<div class="uslider-controls uslider-control-next"><a href="#" class="uslider-control-next" title="Next">Next</a></div>
	{[ } else if(settings['controls_type'] == "arrows-stacked"){ ]}
	<ul class="uslider-pager"></ul>
	{[ } else if(settings['controls_type'] == "dots"){ ]}
	<ul class="uslider-pager"></ul>
	{[ } else if(settings['controls_type'] == "thumbnails"){ ]}
	<ul class="uslider-controls"><li class="uslider-controls uslider-control-prev"><a href="#" title="Prev">Prev</a></li><li class="uslider-controls uslider-control-next"><a href="#" title="Next">Next</a></li></ul>
	{[ } ]}
</div>
</script>