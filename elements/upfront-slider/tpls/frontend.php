<script id="uslider-template" type="text/template">
<div class="uslider-container {{ sliderClasses }}">

	{[ if(settings['controls_type'] == "arrows-simple") { ]}
	<div class="uslider-controls uslider-control-prev"><a href="#" title="Prev">Prev</a></div>
	{[ } ]}
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
	<div class="uslider-controls uslider-control-next"><a href="#" title="Next">Next</a></div>
	{[ } else if(settings['controls_type'] == "arrows-stacked"){ ]}
	<ul class="uslider-controls"><li class="uslider-controls uslider-control-prev"><a href="#" title="Prev">Prev</a></li><li class="uslider-controls uslider-control-next"><a href="#" title="Next">Next</a></li></ul>
	{[ } else if(settings['controls_type'] == "dots"){ ]}
	<ul class="uslider-controls uslider-pager"></ul>
	{[ } else if(settings['controls_type'] == "thumbnails"){ ]}
		<div class="uslider-controls uslider-thumbnails">
		{[ for(var i=0; i<slidesLength; i++){ var slide = slides[i]; ]}
			<img src="{{ slide['images']['thumbnail']['url'] }}" alt="{{ slide['title'] }}" class="uslide-thumbnail uslide-thumbnail-{{ i }}">
		{[ } ]}	
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