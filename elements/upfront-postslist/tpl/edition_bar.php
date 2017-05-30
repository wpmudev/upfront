<div class="ueditor-bar ueditable" id="{{cid}}">
	<div class="ueditor-bar-buttons">
		<a href="#" class="ueditor-bar-show_advanced ueditor-bar-icon ueditor-bar-icon-only" title="{{Upfront.Settings.l10n.global.content.advanced_tools}}"></a>
		{[ if(cancelButton){ ]}
		<a class="ueditor-action-cancel sidebar-commands-button light ueditor-bar-icon" href="#">{{Upfront.Settings.l10n.global.content.cancel}}</a>
		{[ } ]}
		{[ if(draftButton){ ]}
		<a class="ueditor-action-draft sidebar-commands-button light" href="#">{{Upfront.Settings.l10n.global.content.save_draft}}</a>
		{[ } ]}
		<a class="ueditor-action-publish sidebar-commands-button light ueditor-bar-icon" href="#">{{buttonText}}</a>
	</div>
	<div class="ueditor-bar-advanced">
		<div class="ueditor-row-item">
			<span class="ueditor-bar-key"></span>
			<div class="ueditor-select-wrapper ueditor-select-status">
				<a class="ueditor-select-value ueditor-bar-icon ueditor-bar-icon-selectable" data-id="status">{{status.name}}</a>
			</div>
		</div>
		<div class="ueditor-row-item">
			<span class="ueditor-bar-key"></span>
			<div class="ueditor-select-wrapper ueditor-select-visibility">
				<a class="ueditor-select-value ueditor-bar-icon ueditor-bar-icon-selectable" data-id="visibility">{{visibility.name}}</a>
				<div class="ueditor-pass-editor">
					<span>{{Upfront.Settings.l10n.global.content.password}}:</span>
					<input type="text" class="upfront-field-text ueditor-pass" value="{{post_password}}">
					<a class="button ueditor-pass-ok small-button">{{Upfront.Settings.l10n.global.content.ok}}</a>
				</div>
			</div>
		</div>
		<div class="ueditor-row-item">
			<span class="ueditor-bar-key"></span>
			<a class="ueditor-action-schedule ueditor-bar-icon ueditor-bar-icon-selectable">{{schedule.text}}</a>
			{{datepicker}}
		</div>	
		<div class="ueditor-row-item"><a href="#" class="ueditor-action-tags ueditor-bar-icon ueditor-bar-icon-only" title="{{Upfront.Settings.l10n.global.content.edit_tax}}"></a></div>
		<div class="ueditor-row-item"><a href="#" class="ueditor-action-url ueditor-bar-icon ueditor-bar-icon-only" title="{{Upfront.Settings.l10n.global.content.edit_url}}"></a></div>		
		<div class="ueditor-row-item"><a href="#" class="ueditor-action-trash ueditor-bar-icon ueditor-bar-icon-only" title="{{Upfront.Settings.l10n.global.content.trash}}"></a></div>
		
	</div>
</div>
<div class="ueditor-bar-ph"></div>