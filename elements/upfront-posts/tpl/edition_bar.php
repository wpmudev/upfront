<div class="ueditor-bar ueditable" id="{{cid}}">
	<div class="ueditor-bar-buttons">
		<a class="ueditor-action-publish" href="#">{{buttonText}}</a>
		{[ if(draftButton){ ]}
		<a class="ueditor-action-draft" href="#">Save draft</a>
		{[ } ]}
		<a class="ueditor-action-trash" href="#">Trash</a>		
	</div>
	<div class="ueditor-bar-cancel">
		<a class="ueditor-action-cancel" href="#">Discard changes</a>
	</div>
	<div class="ueditor-bar-options">
		<div class="ueditor-row">
			<div class="ueditor-row-item"><a href="#" class="ueditor-action-tags">Edit Categories/Tags</a></div>
			<div class="ueditor-row-item"><a href="#" class="ueditor-action-url">Edit URL</a></div>
		</div>
		<div class="ueditor-row">
			<div class="ueditor-row-item">
				<span class="ueditor-bar-key">Status: </span>
				<div class="ueditor-select ueditor-select-status">
					<a class="ueditor-select-value" data-id="{{status.value}}">{{status.name}}</a>
					<div class="ueditor-select-options">
						{[ _.each(statusOptions, function(option){ ]}
							<a class="ueditor-select-option ueditor-action-status" data-id="{{option.value}}">{{option.name}}</a>
						{[ }); ]}
					</div>
					<input type="text" class="ueditor-select-focus">
				</div>
			</div>
			<div class="ueditor-row-item">
				<span class="ueditor-bar-key">Visibility: </span>
				<div class="ueditor-select ueditor-select-visibility">
					<a class="ueditor-select-value" data-id="{{visibility.value}}">{{visibility.name}}</a>
					<div class="ueditor-select-options">
						{[ _.each(visibilityOptions, function(option){ ]}
							<a class="ueditor-select-option ueditor-action-visibility" data-id="{{option.value}}">{{option.name}}</a>
						{[ }); ]}
					</div>
					<input type="text" class="ueditor-select-focus">
					<div class="ueditor-pass-editor">
						<span>Password:</span>
						<input type="text" class="upfront-field-text ueditor-pass" value="{{post_password}}">
						<a class="button ueditor-pass-ok">Ok</a>
					</div>
				</div>
			</div>
			<div class="ueditor-row-item">
				<span class="ueditor-bar-key">{{schedule.key}}:</span>
				<a class="ueditor-action-schedule">{{schedule.value}}</a>
			</div>	
		</div>
	</div>
</div>
<div class="ueditor-bar-ph"></div>