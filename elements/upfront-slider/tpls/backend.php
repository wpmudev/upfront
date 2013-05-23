<script type="text/template" id="uslide-editdialog-template">
<div id="uslider-slide-edit-dialog-form" title="{{dialogTitle}}">
	<table>
		<tr>
			<td class="uslider-slide-image-col">
				<input type="hidden" name="uslider-slide-edit-id-original" id="uslider-slide-edit-id-original" value="{{originalId}}" />
				<input type="hidden" name="uslider-slide-edit-id" id="uslider-slide-edit-id" value="{{id}}" />
				<input type="hidden" name="uslider-slide-edit-obj" id="uslider-slide-edit-obj" value="{{obj}}" />
				<img id="uslider-slide-image-thumb" src="{{imageUrl}}" alt="" />

				<button type="button" id="uslider-slide-change-image-button">{{changeButtonText}}</button>	
				{[ if(imageUrl){ ]}	
				<button type="button" id="uslider-slide-remove-image-button">{{removeButtonText}}</button>	
				{[ } ]}	
			</td>
			<td class="uslider-slide-info-col">
				<label for="uslider-slide-title">{{titleLabel}}</label>
				<input type="text" name="uslider-slide-title" id="uslider-slide-title" value="slide.title" />
				<label for="uslider-slide-description">{{descriptionLabel}}</label>
				<textarea name="uslider-slide-description" rows="12" id="uslider-slide-description">{{slide.description}}</textarea>
				<label for="uslider-slide-links-to">{{linkLabel}}</label>
				<input type="text" name="uslider-slide-links-to" id="uslider-slide-links-to" value="{{slide.links_to}}" />
			</td>
		</tr>
	</table>
</div>
</script>

<script type="text/template" id="uslide-editdialog-template">
<div id="uslider-slide-edit-dialog-form" title="{{dialogTitle}}">
	<table>
		<tr>
			<td class="uslider-slide-image-col">
				<input type="hidden" name="uslider-slide-edit-id-original" id="uslider-slide-edit-id-original" value="{{originalId}}" />
				<input type="hidden" name="uslider-slide-edit-id" id="uslider-slide-edit-id" value="{{id}}" />
				<input type="hidden" name="uslider-slide-edit-obj" id="uslider-slide-edit-obj" value="{{obj}}" />
				<img id="uslider-slide-image-thumb" src="{{imageUrl}}" alt="" />

				<button type="button" id="uslider-slide-change-image-button">{{changeButtonText}}</button>	
				{[ if(imageUrl){ ]}	
				<button type="button" id="uslider-slide-remove-image-button">{{removeButtonText}}</button>	
				{[ } ]}	
			</td>
			<td class="uslider-slide-info-col">
				<label for="uslider-slide-title">{{titleLabel}}</label>
				<input type="text" name="uslider-slide-title" id="uslider-slide-title" value="slide.title" />
				<label for="uslider-slide-description">{{descriptionLabel}}</label>
				<textarea name="uslider-slide-description" rows="12" id="uslider-slide-description">{{slide.description}}</textarea>
				<label for="uslider-slide-links-to">{{linkLabel}}</label>
				<input type="text" name="uslider-slide-links-to" id="uslider-slide-links-to" value="{{slide.links_to}}" />
			</td>
		</tr>
	</table>
</div>
</script>


<script type="text/template" id="uslider-contentfield-template">
<div class="uslider_content_thumbs">
{[ _.each(slides, function(slide){ ]}
{{slideTemplate(slide)}}
{[ }) ]}
</div>
<div class="uslider_content_buttons">
	<a href="#" class="uslider_content_button uslider_content_add">Add</a>
	<a href="#" class="uslider_content_button uslider_content_edit">Edit</a> 
	<a href="#" class="uslider_content_button uslider_content_remove">Remove</a>
</div>
</script>


<script type="text/template" id="uslider-content-imgslide-template">
	<div class="uslider_content_imgslide">
		<img src="{{image}}" title="{{title}}" />
	</div>
</script>

<script type="text/template" id="uslider-content-textslide-template">
	<div class="uslider_content_textslide" title="{{description}}">
		{{title}}
	</div>
</script>

