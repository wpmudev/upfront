<form>
	<label>{{Upfront.Settings.l10n.global.content.menu_item_label}}</label>
	<input type="text" class="menu-item-title upfront-field upfront-field-text" value="{{ title }}">
	<label class="item-links-to-label upfront-field-padding-top">{{Upfront.Settings.l10n.global.content.links_to}}</label>
	<div class="menu-item-type-editor">
		{[if(type == 'external') { ]}
			<input type="text" class="menu-item-external-input upfront-field upfront-field-text" value="{{url}}" placeholder="{{Upfront.Settings.l10n.global.content.type_link_url}}" >
		{[ } ]}
		{[if(type == 'entry') { ]}
			<span class="menu-item-entry-display">{{url}}</span>
			<span class="menu-item-entry-input" >{{Upfront.Settings.l10n.global.content.edit_link}}</span>
		{[ } ]}
		{[if(type == 'anchor') { ]}
		<div class="anchor-selector">
		</div>
		{[ } ]}
		{[if(type == 'email') { ]}
		<div class="upfront-field-wrap ulinkpanel-external-wrap">
			<input type="text" value="{{url}}" placeholder="johnsmith@example.com" class="menu-item-email-input upfront-field upfront-field-text">
		</div>
		{[ } ]}
		{[if(type == 'lightbox') { ]}
			{[ if(lightboxes.length) { ]}
				<div class="lightbox-selector">
				</div>
			{[ } else { ]}

			{[ } ]}
				<span data-lightbox="{{lightbox}}" title="View Lightbox" class="link-panel-lightbox-trigger">→</span>

				<div class="new-lightbox">
						<label>{{Upfront.Settings.l10n.global.content.create_lightbox}}</label>
						<input type="text" name="menu-item-lightbox-input" class="menu-item-lightbox-input upfront-field upfront-field-text upfront-field-empty" value="" placeholder="{{Upfront.Settings.l10n.global.content.lightbox_name}}" />
				</div>
		{[ } ]}
		{[if(type !== 'lightbox' && type !== 'anchor') { ]}
			<label class="menu-item-target-label">{{Upfront.Settings.l10n.global.content.link_opens_in}}</label>
		{[ } ]}
	</div>
</form>
