<div class="ueditor-bar ueditable" id="{{cid}}">
	<div class="ueditor-bar-buttons">
		<a href="#" class="ueditor-bar-show_advanced">Advanced</a>
		<a class="ueditor-action-cancel ueditor-bar-icon" href="#">Cancel</a>
		{[ if(draftButton){ ]}
		<a class="ueditor-action-draft" href="#">Save draft</a>
		{[ } ]}
		<a class="ueditor-action-publish ueditor-bar-icon" href="#">{{buttonText}}</a>
	</div>
	<div class="ueditor-bar-advanced">
		<div class="ueditor-row-item">
			<span class="ueditor-bar-key"></span>
			<div class="ueditor-select-wrapper ueditor-select-status">
				<a class="ueditor-select-value" data-id="status">{{status.name}}</a>
			</div>
		</div>
		<div class="ueditor-row-item">
			<span class="ueditor-bar-key"></span>
			<div class="ueditor-select-wrapper ueditor-select-visibility">
				<a class="ueditor-select-value" data-id="visibility">{{visibility.name}}</a>
				<div class="ueditor-pass-editor">
					<span>Password:</span>
					<input type="text" class="upfront-field-text ueditor-pass" value="{{post_password}}">
					<a class="button ueditor-pass-ok small-button">Ok</a>
				</div>
			</div>
		</div>
		<div class="ueditor-row-item">
			<span class="ueditor-bar-key"></span>
			<a class="ueditor-action-schedule">{{schedule.text}}</a>
			{{datepicker}}
		</div>	
		<div class="ueditor-row-item"><a href="#" class="ueditor-action-tags">Edit Categories/Tags</a></div>
		<div class="ueditor-row-item"><a href="#" class="ueditor-action-url">Edit URL</a></div>		
		<div class="ueditor-row-item"><a href="#" class="ueditor-action-trash">Trash</a></div>
		
	</div>
</div>
<div class="ueditor-bar-ph"></div>