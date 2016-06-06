(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'elements/upfront-post-data/js/post-data-views',
	'elements/upfront-post-data/js/post-data-settings',
	'scripts/upfront/preset-settings/util'
], function(tpl, Views, PostDataSettings, PresetUtil) {

var l10n = Upfront.Settings.l10n.post_data_element;
var $template = $(tpl);

var data = {};

var PostDataPartModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = Upfront.data.upfront_post_data_part
			? _.clone(Upfront.data.upfront_post_data_part)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var PostDataModel = Upfront.Models.ObjectGroup.extend({
	init: function () {
		var data_type = this.get_property_value_by_name('data_type'),
			data_key = data_type ? 'upfront_post_data_' + data_type : 'upfront_post_data',
			properties = Upfront.data[data_key]
			? _.clone(Upfront.data[data_key])
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var PostDataPartView = Upfront.Views.ObjectView.extend({
	init: function () {
	},

	on_render: function () {
		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
		
		//Prepare post!
		if(Upfront.data.posts[this.postId]){
			this.post = Upfront.data.posts[this.postId];
			if(!this.post.meta.length)
				this.post.meta.fetch();
		}

		this.update_height();
	},

	update: function (prop, options) {
		// Ignore preset changes since post part will have no preset
		if ( prop && prop.id == 'preset' ) return;
		this.constructor.__super__.update.call(this, prop, options);
		this.adjust_featured_image();
	},

	on_element_drop: function () {
		this.update_height();
	},

	render_view: function (markup) {
		this.$el.find('.upfront-object-content').empty().append(markup);
		this.adjust_featured_image();
		this.prepare_editor();
		Upfront.Events.trigger('post-data:part:rendered', this, markup);
	},

	prepare_editor: function () {
		var me = this,
			type = this.model.get_property_value_by_name('part_type'),
			node = this.$el.find('.upfront-object-content')
		;
		if ( this._editor_prepared && this.editor_view ){
			this.editor_view.setElement(node);
			this.trigger_edit();
		}
		else if ( !this._editor_prepared && Upfront.Views.PostDataEditor ) {
			Upfront.Views.PostDataEditor.addPartView(type, node.get(0), this.model, this.object_group_view.model).done(function(view){
				me.editor_view = view;
				me.trigger_edit();
			});
			this._editor_prepared = true;
		}
	},

	/**
	 * Part objects do *NOT* get individual control items - parent group does
	 */
	getControlItems: function () {
		return _([]);
	},

	/**
	 * Trigger edit if it's in the middle of editing (re-rendering whie editing)
	 */
	trigger_edit: function () {
		if (Upfront.Application.user_can("EDIT") === false) {
			if (parseInt(Upfront.Views.PostDataEditor.post.get('post_author'), 10) === Upfront.data.currentUser.id && Upfront.Application.user_can("EDIT_OWN") === true) {
				// Pass through
			} else {
				return;
			}
		}

		if ( !Upfront.Views.PostDataEditor.contentEditor || !Upfront.Views.PostDataEditor.contentEditor._editing ) return;

		if( this.editor_view )
			this.editor_view.editContent();
	},

	/*on_element_edit_start: function () {
		return;
	},

	on_element_edit_stop: function () {
		return;
	},*/

	update_height: function () {
		var type = this.model.get_property_value_by_name('part_type');
		if ( type == 'content' || type == 'comments' ) {
			// If type is content or comments, disable min-height to prevent excessive spaces
			this.$el.find('> .upfront-object').css('min-height', '');
			this.object_group_view.$el.find('> .upfront-object-group').css('min-height', '');
			this.object_group_view.parent_module_view.$el.find('> .upfront-module').css('min-height', '');
			this.add_region_class('upfront-region-container-has-' + type, true);
		}
	},

	adjust_featured_image: function () {
		var $temp_img = this.$el.find('.thumbnail img').attr('src')
		var me = this,
			$me = this.$el.find('> .upfront-editable_entity'),
			type = this.model.get_property_value_by_name('part_type'),
			baseline = Upfront.Settings.LayoutEditor.Grid.baseline,
			row = this.model.get_breakpoint_property_value('row', true),
			height = row * baseline,
			padding_top = parseInt($me.css('padding-top'), 10),
			padding_bottom = parseInt($me.css('padding-bottom'), 10)
		;
		if ( type != 'featured_image' ) return;
		if ( this._editor_prepared && this.editor_view ) {
			this.editor_view.updateImageSize();
		}

		var imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data');

		height -= padding_top + padding_bottom;
		this.$el.find('.thumbnail').each(function(){
			var width = $(this).width(),
				$img = $(this).find('img'),
				img = new Image,
				img_h, img_w
			;
			$(this).css('height', height);
			// Make sure image is loaded first
			$('<img>').attr('src', $img.attr('src')).on('load', function(){
				if ( $(this).attr('data-resize') == "1" ) {
					img.src = $img.attr('src');
					img_h = img.height;
					img_w = img.width;
					if ( height/width > img_h/img_w ) {
						$img.css({ height: '100%', width: 'auto', marginLeft: (width-Math.round(height/img_h*img_w))/2, marginTop: "" });
					}
					else {
						$img.css({ height: 'auto', width: '100%', marginLeft: "", marginTop: (height-Math.round(width/img_w*img_h))/2 });
					}
				}
				else {
					if(_.isObject(imageData) && imageData.imageSize) {
						$img.css('width', imageData.imageSize.width);
						$img.css('top', -imageData.imageOffset.top);
						$img.css('left', -imageData.imageOffset.left);
					}
				}
			});
		});
	},

	cleanup: function () {
		var type = this.model.get_property_value_by_name('part_type');
		this.remove_region_class('upfront-region-container-has-' + type, true);
	},

});

var PostDataView = Upfront.Views.ObjectGroup.extend({
	init: function () {
		this.listenTo(this.model.get('objects'), 'change', this.on_render);
		this.listenTo(this.model.get('objects'), 'add', this.on_render);
		this.listenTo(this.model.get('objects'), 'remove', this.on_render);
		// this.listenTo(Upfront.Events, 'editor:post_details:ready', this.render_view_type);
		
		this.listenTo(Upfront.Events, 'editor:post:tax:updated', this.update_categories);

		/*_.extend(this.events, {
			'click .upfront-post-part-trigger': 'on_edit_click'
		});*/
		

		this.prepare_editor();

		this._multiple = false;
		
		this.delegateEvents();
	},

	get_extra_buttons: function(){
		//return '<a href="#" title="' + l10n.edit_post_parts + '" class="upfront-icon-button upfront-icon-button-nav upfront-post-part-trigger"></a>';
		return '';
	},

	getControlItems: function(){
		var me = this,
			objects = this.get_child_objects(false),
			type = this.model.get_property_value_by_name('data_type'),
			is_locked = this.model.get_property_value_by_name('is_locked')
			controls = []
		;

		if(typeof type !== "undefined" && type === "featured_image") {
			if(typeof is_locked !== "undefined" && is_locked === true) {
				var lock_icon = 'lock-locked';
			} else {
				var lock_icon = 'lock-unlocked';
			}
			
			var moreOptions = new Upfront.Views.Editor.InlinePanels.SubControl();

			moreOptions.icon = 'more';
			moreOptions.tooltip = l10n.image_options;

			moreOptions.sub_items = {}
			moreOptions.sub_items['swap'] = this.createControl('swap', l10n.swap_image, 'openImageSelector');
			moreOptions.sub_items['crop'] = this.createControl('crop', l10n.edit_image, 'editImage');
			moreOptions.sub_items['lock'] = this.createControl(lock_icon, l10n.lock_image, 'lockImage');

			controls.push(moreOptions);
		}

		if ( objects.length > 1 ) {
			controls.push(this.createControl('reorder', l10n.settings, 'on_edit_click'));
			this._multiple = true;
		}
		else {
			this._multiple = false;
		}
		controls.push(this.createPaddingControl());
		controls.push(this.createControl('settings', l10n.settings, 'on_settings_click'));
		return _(controls);
	},
	
	lockImage: function () {
		var me = this,
			is_locked = this.property('is_locked')
			//sizeCheck = this.checkSize()
		;

		if(typeof is_locked !== "undefined" && is_locked === true) {
			//Update icon
			this.controls.$el.find('.upfront-icon-region-lock-locked')
				.addClass('upfront-icon-region-lock-unlocked')
				.removeClass('upfront-icon-region-lock-locked');

			this.property('is_locked', false);
			
			/*
			if(sizeCheck === "small") {
				this.$('.upfront-image-caption-container, .upfront-image-container').css({
					width: '100%',
					height: '100%',
					marginTop: 0
				});

				this.fitImage();

				this.cropTimer = setTimeout(function(){
					me.saveTemporaryResizing();
				}, this.cropTimeAfterResize);
			}
			*/
		} else {
			//Update icon
			this.controls.$el.find('.upfront-icon-region-lock-unlocked')
				.addClass('upfront-icon-region-lock-locked')
				.removeClass('upfront-icon-region-lock-unlocked');

			this.property('is_locked', true);
		}
	},
	
	openImageSelector: function() {
		this.editor.contentEditor.trigger('swap:image', this.postId);
	},
	
	editImage: function() {
		this.editor.contentEditor.trigger('edit:image');
	},

	get_preset_properties: function() {
		var preset = this.model.get_property_value_by_name("preset"),
			type = this.model.get_property_value_by_name("data_type"),
			props = PresetUtil.getPresetProperties(type + '_element', preset) || {}
		;

		return props;
	},

	get_preset_property: function(prop_name) {
		var props = this.get_preset_properties();
		return props[prop_name];
	},

	get_child_objects: function (include_spacer) {
		return this.model.get('objects').filter(function(object){
			var view_class = object.get_property_value_by_name('view_class');
			if ( 'PostDataPartView' == view_class ) return true;
			else return ( include_spacer === true );
		});
	},

	on_edit_click: function (e) {
		if( typeof e !== "undefined" ){
			e.preventDefault();
		}
		this.enable_object_edit();
	},
	
	update_categories: function () {
		var me = this, 
		type = this.model.get_property_value_by_name("data_type");
		
		if(type === "taxonomy") {
			setTimeout( function () {
				me.render_view(type);
			}, 200);
		}
	},
	
	render_view_type: function () {
		var type = this.model.get_property_value_by_name("data_type");
		this.render_view(type);
		
	},

	on_render: function () {
		var me = this,
			type = this.model.get_property_value_by_name("data_type"),
			objects = this.get_child_objects(false)
		;

		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
		
		//Prepare post!
		if(Upfront.data.posts[this.postId]){
			this.post = Upfront.data.posts[this.postId];
			if(!this.post.meta.length)
				this.post.meta.fetch();
		}
		
		this.render_view_type();
		
		if ( this.parent_module_view ) {
			this.$control_el = this.$el;
			if ( this.controls && ( ( objects.length > 1 && !this._multiple ) || ( objects.length == 1 && this._multiple ) ) ) {
				this.controls.remove();
				this.controls = false;
				this.$control_el.find('>.upfront-element-controls').remove();
			}
			this.updateControls();
			var me = this;
			setTimeout(function() {
				if(me.paddingControl && typeof me.paddingControl.isOpen !== 'undefined' && !me.paddingControl.isOpen)	me.paddingControl.refresh();
			}, 300);
		}
	},

	render_view: function (type) {
		var preset = this.model.get_property_value_by_name('preset'),
			me = this
		;

		if ( this.child_view ) {
			this.child_view.render();
			return;
		}
		type = type || Views.DEFAULT;
		var view = Views[type]
			? new Views[type]({model: this.model})
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.element.postId = this.editor.postId;
		view.render();

		this.child_view = view;

		this.$el.find(".upfront-object-group-default").append(view.$el);

	},
	
	toggle_child_objects_loading: function (loading) {
		var objects = this.get_child_objects(false),
			loading = _.isUndefined(loading) ? false : loading;
		;

		_.each(objects, function (object) {
			var view = Upfront.data.object_views[object.cid];
			if ( !view || !view._editor_prepared || !view.editor_view ) return;
			view.editor_view.loading = loading;
		});
	},

	prepare_editor: function () {
		this.listenTo(Upfront.Views.PostDataEditor, 'post:saved post:trash', this.on_render);
		this.listenTo(Upfront.Views.PostDataEditor, 'post:cancel', this.on_cancel);
		this.listenTo(Upfront.Views.PostDataEditor, 'editor:edit:start', this.on_edit_start);
		this.listenTo(Upfront.Views.PostDataEditor, 'editor:edit:stop', this.on_edit_stop);
		// Listen to change event too
		this.listenTo(Upfront.Views.PostDataEditor, 'editor:change:author', this.on_author_change);
		this.listenTo(Upfront.Views.PostDataEditor, 'editor:change:date', this.on_date_change);
		this.stopListening(Upfront.Views.PostDataEditor, 'editor:change:title');
		this.listenTo(Upfront.Views.PostDataEditor, 'editor:change:title', this.on_title_change);
		this.stopListening(Upfront.Views.PostDataEditor, 'editor:change:content');
		this.listenTo(Upfront.Views.PostDataEditor, 'editor:change:content', this.on_content_change);
		this.stopListening(Upfront.Events, 'editor:change:content');
		this.listenTo(Upfront.Events, 'editor:change:content', this.on_content_change);
		this.stopListening(Upfront.Events, 'featured_image:updated');
		this.listenTo(Upfront.Events, 'featured_image:updated', this.update_featured);
		this.editor = Upfront.Views.PostDataEditor;
	},

	/**
	 * On cancel handler, do rerender with cached data
	 */
	on_cancel: function () {
		if ( ! this.child_view ) return;
		this.child_view.rerender();
	},

	/**
	 * On edit start handler, don't cache data on requested rendering
	 */
	on_edit_start: function () {
		if ( ! this.child_view ) return;
		this.child_view._do_cache = false;
		Upfront.Events.trigger('upfront:element:edit:start', 'text');
	},

	/**
	 * On edit stop handler, do enable caching back
	 */
	on_edit_stop: function () {
		if ( ! this.child_view ) return;
		this.child_view._do_cache = true;
		Upfront.Events.trigger('upfront:element:edit:stop', 'text');
	},

	/**
	 * On title change handler, do nothing for now, just for handy reference in case we need it
	 * @param {String} title
	 */
	on_title_change: function (title) {
		this.set_post_title = title;
	},

	/**
	 * On content change handler, do nothing for now, just for handy reference in case we need it
	 * @param {String} content
	 * @param {Bool} isExcerpt
	 */
	on_content_change: function (content, isExcerpt) {
		this.set_post_content = content;
	},

	/**
	 * On author change handler, rerender if this is author element
	 * @param {Object} authorId
	 */
	on_author_change: function (authorId) {
		if ( ! this.child_view ) return;
		var type = this.model.get_property_value_by_name("data_type");
		this.authorId = authorId;
		// Render again if it's author element
		if ( 'author' == type ) {
			this.child_view.render();
		}
	},

	/**
	 * On date change handler, rerender if this is post data element
	 * @param {Object} date
	 */
	on_date_change: function (date) {
		if ( ! this.child_view ) return;
		var type = this.model.get_property_value_by_name("data_type");
		this.postDate = Upfront.Util.format_date(date, true, true).replace(/\//g, '-');
		// Render again if it's post data element
		if ( 'post_data' == type ) {
			this.child_view.render(['date_posted']); // Only render the date_posted part
		}
	},


	on_element_edit_start: function (edit, post) {
		if ( edit == 'write' && this.parent_module_view ){
			this.parent_module_view.$el.find('>.upfront-module').addClass('upfront-module-editing');
			this.parent_module_view.disable_interaction(false, true, false, false, true);
		}
		else {
			this.constructor.__super__.on_element_edit_start.call(this, edit, post);
		}
	},

	on_element_edit_stop: function (edit, post, saving_draft) {
		if ( edit == 'write' && this.parent_module_view && this.parent_module_view.enable_interaction && saving_draft !== true ){
			this.parent_module_view.$el.find('>.upfront-module').removeClass('upfront-module-editing');
			this.parent_module_view.enable_interaction(true);
		}
		else {
			this.constructor.__super__.on_element_edit_stop.call(this, edit, post, saving_draft);
		}
	},
	
	checkSize: function() {
		var imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data');

		var maskSize = this.model.get_breakpoint_property_value('element_size', true),
			size = imageData.imageSize;

		if(size.width >= maskSize.width && size.height >= maskSize.height) {
			return 'big';
		}

		return 'small';
	},
	
	get_thumb_data: function() {
		// Retrieve image data from post meta
		var imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data');

		// Store variables used in resize event handlers
		this.resizingData = {
			data: {
				imageId: imageData.imageId,
				position: imageData.imageOffset,
				size: imageData.imageSize,
				rotation: imageData.rotation,
				checkSize: this.checkSize(),
				stretch: imageData.stretch,
				vstretch: imageData.stretch
			},
			img: this.$('.thumbnail').find('img'),
		};
	},
	
	on_element_resize_start: function(attr) {
		// Check if featured image element
		var type = this.model.get_property_value_by_name("data_type");
		if(type !== "featured_image") return;
		
		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}	

		this.$('.thumbnail').find('img').css('min-height', 'auto');
	},
	
	on_element_resizing: function(attr) {
		// Check if featured image element
		var type = this.model.get_property_value_by_name("data_type");
		if(type !== "featured_image") return;

		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}	

		var data = this.resizingData.data,
			img = this.$el.find('.thumbnail img'),
			// padding = this.property('no_padding') == 1 ? 0 : this.updateBreakpointPadding(breakpointColumnPadding),
			column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
			elementWidth = parseInt(attr.width),
			elementHeight = parseInt(attr.height),
			hPadding = parseInt( this.model.get_breakpoint_property_value('left_padding_num') || column_padding ) + parseInt( this.model.get_breakpoint_property_value('right_padding_num') || column_padding ),
			vPadding = parseInt( this.model.get_breakpoint_property_value('top_padding_num') || column_padding ) + parseInt( this.model.get_breakpoint_property_value('bottom_padding_num') || column_padding ),
			imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
			ratio,
			newSize;

		data.elementSize = {width: elementWidth < 0 ? 10 : elementWidth, height: elementHeight < 0 ? 10 : elementHeight};

		if(attr.axis === "e" || attr.axis === "w") {
			data.elementSize.height = data.elementSize.height;
		}

		newSize = this.getElementShapeSize(data.elementSize);
		if ( false !== newSize ) {
			data.elementSize = newSize;
		}

		this.applyElementSize(data.elementSize.width, data.elementSize.height, false); // This won't update element_size property

		//if(starting.length){
		//	return starting.outerHeight(data.elementSize.height);
		//}

		//Wonderful stuff from here down
		this.$('.thumbnail').css('height', data.elementSize.height);
		this.$('.thumbnail').parent().css({'height': data.elementSize.height, 'max-height': data.elementSize.height, 'min-height': data.elementSize.height });

		var is_locked = this.property('is_locked');

		if(is_locked === false) {
			//Resizing the stretching dimension has priority, the other dimension just alter position
			if(data.stretch && !data.vstretch){
				this.resizingH(img, data, true);
				this.resizingV(img, data);
			} else if(!data.stretch && data.vstretch){
				this.resizingV(img, data, true);
				this.resizingH(img, data);
			} else {
				//Both stretching or not stretching, calculate ratio difference
				ratio = data.size.width / data.size.height - data.elementSize.width / data.elementSize.height;
				//Depending on the difference of ratio, the resizing is made horizontally or vertically
				if(ratio > 0 && data.stretch || ratio < 0 && ! data.stretch){
					this.resizingV(img, data, true);
					this.resizingH(img, data);
				}
				else {
					this.resizingH(img, data, true);
					this.resizingV(img, data);
				}
			}
		} else {
			var vertical_align = imageData.valign,
				current_position = imageData.imageOffset,
				isDotAlign = imageData.isDotAlign,
				containerHeight = this.$('.upfront-image-container').height(),
				sizeCheck = this.checkSize(),
				imgPosition = img.position(),
				maskSize = this.getMaskSize(attr),
				imageView = this.getImageViewport(),
				originalImageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
				margin;

			if(typeof imageView.width !== "undefined") {
				if(data.elementSize.width > imageView.width) {
					img.css({left: imgPosition.left + (data.elementSize.width - imageView.width)});
				}
			}

			if(typeof imageView.height !== "undefined") {
				if(data.elementSize.height > imageView.height) {
					img.css({top: imgPosition.top + (data.elementSize.height - imageView.height)});
				}
			}

			if(sizeCheck === "small" && isDotAlign === true) {
				if(vertical_align === "center") {
					if(data.size.height < data.elementSize.height) {
						margin = (data.size.height - data.elementSize.height) / 2;
					} else {
						margin = -(data.elementSize.height - containerHeight) / 2;
					}
				}

				if(vertical_align === "bottom") {
					if(data.size.height < data.elementSize.height) {
						margin = (data.size.height - data.elementSize.height);
					} else {
						margin = -(data.elementSize.height - containerHeight)
					}
				}

				var offset = { top: margin, left: current_position.left },
					img = this.$el.find('.thumbnail img')
				;

				// Update position and resize
				newImageData = _.extend(originalImageData, {
					'imageOffset': {top: margin, left: current_position.left},
					'position': {top: margin, left: current_position.left}
				});
				
				Upfront.Events.trigger("featured:image:resized", newImageData);
				
				img.css('top', -offset.top);
				img.css('left', -offset.left);
				
				this.resizingData.data.cropBig = true;
			} else {
				this.resizingData.data.cropBig = false;
			}
		}
	},
	
	on_element_resize: function (attr) {
		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}
		
		// Check if featured image element
		var type = this.model.get_property_value_by_name("data_type");

		if(type === "featured_image") {
			//Save image
			var objects = this.get_child_objects(false),
				breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
				grid = Upfront.Settings.LayoutEditor.Grid,
				padding_top_row = parseInt( this.model.get_breakpoint_property_value("top_padding_use", true) ?  this.model.get_breakpoint_property_value('top_padding_num', true) / grid.baseline : 0, 10 ),
				padding_bottom_row = parseInt( this.model.get_breakpoint_property_value("bottom_padding_use", true) ? this.model.get_breakpoint_property_value('bottom_padding_num', true) / grid.baseline : 0, 10 )
				vPadding = padding_top_row + padding_bottom_row,
				img = this.$el.find('img'),
				imgSize = {width: img.width(), height: img.height()},
				imgPosition = img.position()
			;

			// Change the sign
			imgPosition.top = -imgPosition.top;
			imgPosition.left = -imgPosition.left;

			this.temporaryProps = {
				size: imgSize,
				position: imgPosition
			};

			// Save image crop from resize
			this.saveTemporaryResizing(attr);
			
			var row = Upfront.Util.height_to_row(parseInt(attr.height));
			
		} else {
			var objects = this.get_child_objects(false),
				breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
				grid = Upfront.Settings.LayoutEditor.Grid,
				padding_top_row = parseInt( this.model.get_breakpoint_property_value("top_padding_use", true) ?  this.model.get_breakpoint_property_value('top_padding_num', true) / grid.baseline : 0, 10 ),
				padding_bottom_row = parseInt( this.model.get_breakpoint_property_value("bottom_padding_use", true) ? this.model.get_breakpoint_property_value('bottom_padding_num', true) / grid.baseline : 0, 10 )
				vPadding = padding_top_row + padding_bottom_row;
			;
			
			var row = Upfront.Util.height_to_row(parseInt(attr.height));
		}
		
		// Also resize child objects if it's only one object
		if ( objects.length != 1 ) return;
		if ( breakpoint.default ) {
			_.each(objects, function(object){
				object.set_property('row', row);
			});
		}
		else {
			_.each(objects, function(object){
				var obj_breakpoint = Upfront.Util.clone(object.get_property_value_by_name('breakpoint') || {});
				if ( !_.isObject(obj_breakpoint[breakpoint.id]) ){
					obj_breakpoint[breakpoint.id] = {};
				}
				obj_breakpoint[breakpoint.id].row = row;
				object.set_property('breakpoint', obj_breakpoint);
			});
		}
		
		Upfront.Events.trigger('entity:object:refresh', this);
	},
	
	getImageViewport: function() {
		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}
		
		var me = this,
			img = this.$el.find('.thumbnail img'),
			imgPosition = img.position(),
			viewPort,
			viewWidth,
			viewHeight;

		if(imgPosition.left < 0) {
			viewWidth = img.width() - Math.abs(imgPosition.left);
		}

		if(imgPosition.top < 0) {
			viewHeight = img.height() - Math.abs(imgPosition.top);
		}

		viewPort = {width: viewWidth, height: viewHeight};

		return viewPort;

	},
	
	getThumbnailData: function () {
		
	},
	
	getMaskSize: function(elementSize) {
		var me = this,
			imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data');

		var	size = imageData.imageSize,
			checkSize = this.checkSize(),
			minWidth = Math.min(size.width, elementSize.width),
			minHeight = Math.min(size.height, elementSize.height)
		;

		var newSize = { width: minWidth, height: minHeight};

		return newSize;
	},
	
	resizingH: function(img, data, size) {
		var elWidth = data.elementSize.width,
			width = size ? data.size.width : img.width(), // The width has been modified if we don't need to set the size
			imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
			left = data.position.left,
			css = {},
			align;

		if(data.stretch) {
			if(elWidth < width - left) {
				css.left = -left;
				if(size) {
					css.width = width;
				}
			} else if(width > elWidth && elWidth >= width - left) {
				css.left = elWidth - width;
				if(size) {
					css.width = width;
				}
			} else {
				css.left = 0;
				if(size) {
					css.width = elWidth;
				}
			}
			if(size) {
				css.height = 'auto';
			}
			img.css(css);
			return;
		}

		if(elWidth > width) {
			align = imageData.align;
			if(align === 'left') {
				css.left = 0;
			} else if(align === 'center') {
				css.left = (elWidth - width) / 2;
			} else {
				css.left = 'auto';
				css.right = 0;
			}
			if(size) {
				css.width = width;
				css.height = 'auto';
			}
			img.css(css);
			return;
		}

		css.left = 0;
		if(size) {
			css.width = elWidth;
			css.height = 'auto';
		}
		img.css(css);
	},

	resizingV: function(img, data, size) {
		var elHeight = data.elementSize.height,
			height = size ? data.size.height : img.height(),
			top = data.position.top,
			css = {};

		if(data.vstretch) {
			if(elHeight < height - top) {
				css.top = -top;
				if(size) {
					css.height = height;
				}
			} else if(height > elHeight && elHeight >= height - top){
				css.top = elHeight - height;
				if(size) {
					css.height = height;
				}
			} else{
				css.top = 0;
				if(size) {
					css.height = elHeight;
				}
			}
			if(size) {
				css.width = 'auto';
			}
			img.css(css);
			return;
		}

		if(elHeight > height - top) {
			css.top = -top;
			if(size) {
				css.height = height;
			}
		} else if(height - top >= elHeight && elHeight > height){
			css.top = elHeight - height;
			if(size) {
				css.height = height;
			}
		} else {
			css.top = 0;
			if(size) {
				css.height = elHeight;
			}
		}

		if(size) {
			css.width = 'auto';
		}
		img.css(css);
	},
	
	getElementShapeSize: function (elementSize) {
		return false;
	},
	
	applyElementSize: function (width, height, set_property) {
		if ( this.parent_module_view ) {
			var me = this,
				parent = this.parent_module_view.$el.find('.upfront-editable_entity:first'),
				resizer = parent,
				captionHeight = this.get_preset_property("caption-position") === 'below_image' ? this.$('.wp-caption').outerHeight() : 0,
				// padding = this.property('no_padding') == 1 ? 0 : this.updateBreakpointPadding(breakpointColumnPadding),
				borderWidth = parseInt(this.$el.find('.upfront-image-caption-container').css('borderWidth') || 0, 10), // || 0 part is needed because parseInt empty sting returns NaN and breaks element height
				column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
				hPadding = parseInt( this.model.get_breakpoint_property_value('left_padding_num') || column_padding ) + parseInt( this.model.get_breakpoint_property_value('right_padding_num') || column_padding ),
				vPadding = parseInt( this.model.get_breakpoint_property_value('top_padding_num') || column_padding ) + parseInt( this.model.get_breakpoint_property_value('bottom_padding_num') || column_padding ),
				// elementSize = {width: resizer.width() - (2 * padding), height: resizer.height() - (2 * padding) - captionHeight}
				elementSize = {width: ( width && !isNaN(width) ? width : resizer.width() ) - hPadding, height: ( height && !isNaN(height) ? height : resizer.height() ) - vPadding - captionHeight - (2 * borderWidth)},
				newSize = this.getElementShapeSize(elementSize)
			;
			if ( false !== newSize ) {
				elementSize = newSize;
			}
			if ( _.isUndefined(set_property) || set_property ) {
				this.model.set_breakpoint_property('row', Upfront.Util.height_to_row(elementSize.height + vPadding), true);
				if ( this.parent_module_view ) {
					this.parent_module_view.model.set_breakpoint_property('row', Upfront.Util.height_to_row(elementSize.height + vPadding), true);
				}
				this.model.set_breakpoint_property('element_size', elementSize);
			}
			//this.$el.find('.uimage-resize-hint').html(this.sizehintTpl({
			//		width: elementSize.width,
			//		height: elementSize.height,
			//		l10n: l10n.template
			//	})
			//);
			// Let's override the min-height set to element
			this.$el.find('> .upfront-object').css('min-height', (elementSize.height + vPadding) + 'px');
			this.$el.closest('.upfront-module').css('min-height', (elementSize.height + vPadding) + 'px');
		}
	},
	
	saveTemporaryResizing: function(elementSize) {
		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}

		var me = this,
			crop = {},
			imageId = this.resizingData.data.imageId,
			resize = this.temporaryProps.size,
			position = this.temporaryProps.position,
			deferred = $.Deferred(),
			import_deferred = $.Deferred(),
			import_promise = import_deferred.promise(),
			originalImageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data');
		;

		crop.top = position.top;
		crop.left = position.left;

		crop.width = Math.min(elementSize.width, resize.width);
		crop.height = Math.min(elementSize.height, resize.height);

		// Update position and resize
		newImageData = _.extend(originalImageData, {
			'imageSize': resize,
			'imageOffset': position,
			'position': position
		});
		
		Upfront.Events.trigger("featured:image:resized", newImageData);

		import_promise.done(function(){
			imageId = me.resizingData.data.imageId,
			Upfront.Views.Editor.ImageEditor.saveImageEdition(
				imageId,
				me.resizingData.data.rotation,
				resize,
				crop
			).done(function(results){
				var imageData = results.data.images[imageId];

				if(imageData.error && !me.isThemeImage){
					Upfront.Views.Editor.notify(l10n.process_error, 'error');
					return;
				}

				newImageData = _.extend(originalImageData, {
					'imageSize': resize,
					'imageOffset': position,
					'position': position,
					'src': imageData.url,
					'srcFull': imageData.urlOriginal,
					'stretch': resize.width >= elementSize.width,
					'vstretch': resize.height >= elementSize.height,
					'gifImage': imageData.gif
				});
				
				Upfront.Events.trigger("featured:image:resized", newImageData);

				clearTimeout(me.cropTimer);
				me.cropTimer = false;
				deferred.resolve();
			});
		});

		if ( this.isThemeImage && 'themeExporter' in Upfront ) {
			this.importImage().always(function(){
				import_deferred.resolve();
			});
		}
		else {
			import_deferred.resolve();
		}

		return deferred.promise();
	},
	
	/**
	 * To keep selected featured image, even on re-rendering
	 * @param {Object} img
	 */
	update_featured: function (img) {
		if ( img && img.attr('src').length > 0 ) this.full_featured_image = img.attr('src');
	},
	
	property: function(name, value, silent) {
		if(typeof value !== 'undefined'){
			if(typeof silent === 'undefined') {
				silent = true;
			}
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
	},

});


var PostDataElement = Upfront.Views.Editor.Sidebar.Element.extend({

	_default_data: {
		type: '',
		columns: 24,
		rows: Upfront.Util.height_to_row(200),
		name: '',
		parts: {

		}
	},

	_post_parts: [],

	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-' + this._default_data.type);
		this.$el.html(this._default_data.name);
	},

	/**
	 * Create default part objects
	 * @param {Array} types
	 */
	create_part_objects: function (types) {
		var me = this,
			objects = [],
			wrappers = []
		;

		// Find hidden data element parts in default preset
		// Just default, because that's what we use when the element is first added
		var data_type = this._default_data.type,
			presets = (Upfront.mainData || {})[data_type + "_elementPresets"] || [],
			hidden = (_.findWhere(presets, {id: "default"}) || {}).hidden_parts || []
		;

		_.each(types, function(type){
			// If this type is hidden in default preset, *don't* add the object/wrapper
			if (hidden.indexOf(type) >= 0) return;

			var object = me.create_part_object(type);
			objects.push( object.object );
			wrappers.push( object.wrapper );
		});
		return {
			objects: objects,
			wrappers: wrappers
		};
	},

	/**
	 * Create default part object
	 * @param {String} type
	 */
	create_part_object: function (type) {
		var default_data = _.isObject(this._default_data.parts) && _.isObject(this._default_data.parts[type]) ? this._default_data.parts[type] : {},
			wrapper_id = Upfront.Util.get_unique_id("wrapper"),
			wrapper = new Upfront.Models.Wrapper({
				properties: [
					{ name: 'wrapper_id', value: wrapper_id },
					{ name: 'class', value: 'c24' }
				]
			}),
			object = new PostDataPartModel({
				properties: [
					{ name: 'view_class', value: 'PostDataPartView' },
					{ name: 'part_type', value: type },
					{ name: 'has_settings', value: 0 },
					{ name: 'class', value: 'c24 upfront-post-data-part part-'+type },
					{ name: 'wrapper_id', value: wrapper_id },
				]
			})
		;
		if ( !_.isUndefined(default_data.rows) ) {
			object.set_property('row', default_data.rows, true);
		}
		return {
			object: object,
			wrapper: wrapper
		};
	},

	add_element: function () {

		var part_objects = this.create_part_objects(this._post_parts),
			object = new PostDataModel({
				properties: [
					{"name": "data_type", "value": this._default_data.type},
					{"name": "row", "value": this._default_data.rows}
				],
				objects: part_objects.objects,
				wrappers: part_objects.wrappers
			}),
			module = new Upfront.Models.Module({
				name: "",
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c" + this._default_data.columns + " upfront-post_data_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": this._default_data.rows}
				],
				objects: [object]
			})
		;
		this.add_module(module);
	}
});

var PostDataElement_PostData = PostDataElement.extend({
	_default_data: {
		type: 'post_data',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Post Data'
	},
	_post_parts: [
		'date_posted',
		'title',
		'content'
	]
});

var PostDataElement_Author = PostDataElement.extend({
	_default_data: {
		type: 'author',
		columns: 4,
		rows: Upfront.Util.height_to_row(100),
		name: 'Author'
	},
	_post_parts: [
		'author',
		'gravatar',
		'author_email',
		'author_url',
		'author_bio'
	]
});

var PostDataElement_Taxonomy = PostDataElement.extend({
	_default_data: {
		type: 'taxonomy',
		columns: 18,
		rows: Upfront.Util.height_to_row(50),
		name: 'Categories & Tags'
	},
	_post_parts: [
		'tags',
		'categories'
	]
});

var PostDataElement_FeaturedImage = PostDataElement.extend({
	_default_data: {
		type: 'featured_image',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Featured Image',
		parts: {
			featured_image: {
				rows: Upfront.Util.height_to_row(200)
			}
		}
	},
	_post_parts: [
		'featured_image'
	]
});

var PostDataElement_Comments = PostDataElement.extend({
	_default_data: {
		type: 'comments',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Comments'
	},
	_post_parts: [
		'comment_count',
		'comments',
		'comments_pagination',
		'comment_form'
	]
});

var PostDataElement_Meta = PostDataElement.extend({
	_default_data: {
		type: 'meta',
		columns: 4,
		rows: Upfront.Util.height_to_row(50),
		name: 'Meta'
	},
	_post_parts: [
		'meta'
	]
});

/**
 * Add the elements to Upfront, only when in single layout. Place the element in DataElement.
 */
function add_elements () {
	if ( 'type' in _upfront_post_data.layout && 'single' === _upfront_post_data.layout.type ) {
		Upfront.Application.LayoutEditor.add_object("Upostdata-post_data", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_PostData,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.date_posted': {label: l10n.css.post_data_date_label, info: l10n.css.post_data_date_info},
				'.title': {label: l10n.css.post_data_title_label, info: l10n.css.post_data_title_info},
				'.title h1': {label: l10n.css.post_data_title_h1_label, info: l10n.css.post_data_title_h1_info},
				'.content': {label: l10n.css.post_data_content_label, info: l10n.css.post_data_content_info},
				'.content p': {label: l10n.css.post_data_content_p_label, info: l10n.css.post_data_content_p_info}
			},
			cssSelectorsId: 'post_post_data'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-author", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Author,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.author': {label: l10n.css.author_author_label, info: l10n.css.author_author_info},
				'.author a': {label: l10n.css.author_author_link_label, info: l10n.css.author_author_link_info},
				'.gravatar': {label: l10n.css.author_gravatar_label, info: l10n.css.author_gravatar_info},
				'.author-email': {label: l10n.css.author_email_label, info: l10n.css.author_email_info},
				'.author-email a': {label: l10n.css.author_email_link_label, info: l10n.css.author_email_link_info},
				'.author-url': {label: l10n.css.author_url_label, info: l10n.css.author_url_info},
				'.author-url a': {label: l10n.css.author_url_link_label, info: l10n.css.author_url_link_info},
				'.author-bio': {label: l10n.css.author_bio_label, info: l10n.css.author_bio_info},
			},
			cssSelectorsId: 'post_author'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-taxonomy", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Taxonomy,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.post_tags': {label: l10n.css.taxonomy_tags_label, info: l10n.css.taxonomy_tags_info},
				'.post_tags a': {label: l10n.css.taxonomy_tags_link_label, info: l10n.css.taxonomy_tags_link_info},
				'.post_categories': {label: l10n.css.taxonomy_category_label, info: l10n.css.taxonomy_category_info},
				'.post_categories a': {label: l10n.css.taxonomy_category_link_label, info: l10n.css.taxonomy_category_link_info},
			},
			cssSelectorsId: 'post_taxonomy'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-featured_image", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_FeaturedImage,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.thumbnail': {label: l10n.css.featured_thumbnail_label, info: l10n.css.featured_thumbnail_info},
				'.thumbnail img': {label: l10n.css.featured_thumbnail_img_label, info: l10n.css.featured_thumbnail_img_info},
			},
			cssSelectorsId: 'post_featured_image'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-comments", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Comments,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.comment_count': {label: l10n.css.comment_count_label, info: l10n.css.comment_count_info},
				'.comments': {label: l10n.css.comments_label, info: l10n.css.comments_info},
				'.comments_pagination': {label: l10n.css.comments_pagination_label, info: l10n.css.comments_pagination_info},

				'.upfront-post_data-comments': {label: l10n.css.comments_label, info: l10n.css.comments_info},
				'.upfront-post_data-comments .comment': {label: l10n.css.comment_label, info: l10n.css.comment_info},
				'.upfront-post_data-comments .comment-wrapper': {label: l10n.css.comment_wrapper_label, info: l10n.css.comment_wrapper_info},
				'.upfront-post_data-comments .avatar': {label: l10n.css.comment_avatar_image_label, info: l10n.css.comment_avatar_image_info},
				'.upfront-post_data-comments .comment-meta': {label: l10n.css.comment_meta_label, info: l10n.css.comment_meta_info},
				'.upfront-post_data-comments .comment-meta .fn a': {label: l10n.css.comment_athor_label, info: l10n.css.comment_author_info},
				'.upfront-post_data-comments .comment-meta .comment-time': {label: l10n.css.comment_time_label, info: l10n.css.comment_time_info},
				'.upfront-post_data-comments .comment-content': {label: l10n.css.comment_content_label, info: l10n.css.comment_content_info},
				'.upfront-post_data-comments .comment-content p': {label: l10n.css.comment_content_p_label, info: l10n.css.comment_content_p_info},
				'.upfront-post_data-comments .edit-link a': {label: l10n.css.edit_link_label, info: l10n.css.edint_link_info},
				'.upfront-post_data-comments .comment-reply a': {label: l10n.css.comment_reply_label, info: l10n.css.comment_reply_info},

				'.comment-respond': {label: l10n.css.comment_form_label, info: l10n.css.comment_form_info},
				'.comment-respond .comment-reply-title': {label: l10n.css.reply_title_label, info: l10n.css.reply_title_info},
				'.comment-respond .logged-in-as': {label: l10n.css.logged_in_label, info: l10n.css.logged_in_info},
				'.comment-respond .logged-in-as a': {label: l10n.css.logged_in_link_label, info: l10n.css.logged_in_link_info},
				'.comment-respond .comment-form-comment': {label: l10n.css.respond_label, info: l10n.css.respond_info},
				'.comment-respond .comment-form-comment input[type="text"]': {label: l10n.css.comment_input_label, info: l10n.css.comment_input_info},
				'.comment-respond .comment-form-comment textarea': {label: l10n.css.comment_textarea_label, info: l10n.css.comment_textarea_info},
				'.comment-respond .form-submit .submit': {label: l10n.css.submit_button, info: l10n.css.submit_button},
			},
			cssSelectorsId: 'post_comments'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-meta", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Meta,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.meta': {label: l10n.css.post_meta_label, info: l10n.css.post_meta_info},
			},
			cssSelectorsId: 'post_meta'
		});
	}
	else {
		Upfront.Application.LayoutEditor.remove_object('Upostdata-post_data');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-author');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-taxonomy');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-featured_image');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-comments');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-meta');
	}
}

Upfront.Events.on("application:setup:editor_interface", function () {
	add_elements();
});
add_elements();



Upfront.Models.PostDataModel = PostDataModel;
Upfront.Models.PostDataPartModel = PostDataPartModel;
Upfront.Views.PostDataView = PostDataView;
Upfront.Views.PostDataPartView = PostDataPartView;


});
}(jQuery));
