<form>
	<label>Menu Item Label:</label>
	<input type="text" class="menu-item-title" value="{{ title }}">
	<label class="item-links-to-label">{{Upfront.Settings.l10n.global.content.links_to}}</label>
	<div class="menu-item-type-editor">
		{[if(type == 'external') { ]}
			<input type="text" class="menu-item-external-input" value="{{url}}" placeholder="Type link URL" >
		{[ } ]}
		{[if(type == 'entry') { ]}
			<a class="menu-item-entry-input" title="{{Upfront.Settings.l10n.global.content.change_link}}"  href="#">{{(!url || url=='' || url=='http://') ? 'Select' : url}}</a>
		{[ } ]}
		{[if(type == 'anchor') { ]}
		<div class="anchor-selector">
		</div>
		{[ } ]}
		{[if(type == 'lightbox') { ]}
			{[ if(lightboxes.length) { ]}
				<div class="lightbox-selector">
				</div>
			{[ } else { ]}

			{[ } ]}

				<div class="new-lightbox">
						<label>Create lightbox</label>
						<input type="text" name="menu-item-lightbox-input" class="menu-item-lightbox-input upfront-field upfront-field-text upfront-field-empty" value="" placeholder="{{Upfront.Settings.l10n.global.content.lightbox_name}}" />
				</div>
		{[ } ]}
	</div>
</form>
