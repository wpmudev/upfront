<form>
	<label>Menu Item Label:</label>
	<input type="text" class="menu-item-title" value="{{ title }}">
	<label class="item-links-to-label">{{Upfront.Settings.l10n.global.content.links_to}}</label>
	<div class="menu-item-type-editor">
		{[if(type == 'external') { ]}
			<input type="text" class="menu-item-external-input" value="{{url}}" placeholder="Type link URL" >
		{[ } ]}
		{[if(type == 'entry') { ]}
			<span class="menu-item-entry-display">{{url}}</span>
			<span class="menu-item-entry-input" >Edit Link</span>
		{[ } ]}
		{[if(type == 'anchor') { ]}
		<div class="anchor-selector">
		</div>
		{[ } ]}
		{[if(type == 'email') { ]}
		<div class="upfront-field-wrap ulinkpanel-external-wrap">
			<input type="text" value="{{url}}" placeholder="johnsmith@example.com" class="menu-item-email-input">
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
		{[if(type !== 'lightbox' && type !== 'anchor') { ]}
			<label class="menu-item-target-label">Link Opens In:</label>
		{[ } ]}
	</div>
</form>
