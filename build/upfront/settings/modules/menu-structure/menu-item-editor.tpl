<form>
	<label>Menu Item Label</label>
	<input type="text" name="menu-item-title" value="{{ title }}">
	<label class="item-links-to-label">{{Upfront.Settings.l10n.global.content.links_to}}</label>
	<div class="menu-item-type-editor">
		{[if(type == 'external') { ]}
			<input type="text" name="menu-item-external-input" value="{{url}}" placeholder="Type link URL" >
		{[ } ]}
		{[if(type == 'entry') { ]}
			<a class="menu-item-entry-input" title="{{Upfront.Settings.l10n.global.content.change_link}}"  href="#">{{(!url || url=='' || url=='http://') ? 'Select' : url}}</a>
		{[ } ]}
		{[if(type == 'anchor') { ]}
		<div class="anchor-selector">
		</div>
		{[ } ]}
	</div>
</form>
