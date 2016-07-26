(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'elements/upfront-post-data/js/post-data-views',
	'elements/upfront-post-data/js/post-data-settings',
	'scripts/upfront/preset-settings/util',
	'scripts/redactor/ueditor-inserts'
], function(tpl, Views, PostDataSettings, PresetUtil, Inserts) {

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

		// Listen to object edit toggle if in ObjectGroup
		if ( this.object_group_view ) {
			this.stopListening(this.object_group_view, 'set:mobile_mode');
			this.listenTo(this.object_group_view, 'set:mobile_mode', this.setMobileMode);
			this.stopListening(this.object_group_view, 'unset:mobile_mode');
			this.listenTo(this.object_group_view, 'unset:mobile_mode', this.unsetMobileMode);
		}

		// Listen to module view position update
		if ( this.parent_module_view ) {
			this.stopListening(this.parent_module_view, 'update_postion');
			this.listenTo(this.parent_module_view, 'update_position', this.update_position);
		}

		this.listenTo(Upfront.Events, 'entity:drop:before_render', this.set_prev_region_container);
		this.update_height();
	},

	update: function (prop, options) {
		// Ignore preset changes since post part will have no preset
		if ( prop && prop.id == 'preset' ) return;
		this.constructor.__super__.update.call(this, prop, options);
		this.adjust_featured_image();
		this.adjust_inserted_image();
	},

	update_position: function () {
		this.constructor.__super__.update_position.call(this);
		this.update_height();
		this.adjust_featured_image();
		this.adjust_inserted_image();
	},

	on_element_drop: function () {
		this.update_height();
	},

	render_view: function (markup) {
		var me = this,
			type = this.model.get_property_value_by_name('part_type')
		;

		this.$el.find('.upfront-object-content').empty().append(markup);
		this.adjust_featured_image();
		this.adjust_inserted_image();
		this.prepare_editor();

		// Show full image if we are in mobile mode
		if(type === "featured_image") {
			if (this.object_group_view.mobileMode) {
				setTimeout( function () {
					me.setMobileMode();
				}, 100);
			}
		}

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

	setMobileMode: function(){
		var type = this.model.get_property_value_by_name('part_type');
		if ( type !== 'featured_image' ) return;
		var props = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
			is_featured_image_set = this.object_group_view.is_featured_image_set(),
			$image = this.$el.find('.thumbnail img'),
			$image_container = $image.parent()
		;

		this.$el.find('.upfront-entity-size-hint').hide();
		this.$el.find('.upost_thumbnail_changer').hide();

		if(is_featured_image_set && props.mode === "small" && props.isDotAlign) {
			$image_container.css('text-align', props.align);
			$image.addClass('uimage-mobile-mode')
				.css({
					position: 'static',
					maxWidth: '100%',
					width: props.imageSize.width,
					height: 'auto',
					minHeight: 'none',
					display: 'inline-block'
				});

			if(props.valign === "center") {
				$image.css({
					marginTop: (props.maskSize.height / 2) - (props.imageSize.height / 2)
				});
			}

			if(props.valign === "bottom") {
				$image.css({
					marginTop: (props.maskSize.height - props.imageSize.height)
				});
			}
		} else {
			$image.addClass('uimage-mobile-mode')
				.css({
					position: 'static',
					maxWidth: '100%',
					width: ( !is_featured_image_set || !props || props.stretch ? '100%' : props.imageSize.width ),
					height: 'auto',
					minHeight: 'none'
				})
			;
		}

		// Set height auto to add possibility to remove the spacing
		$image_container.parent().css({
			width: '100%',
			height: 'auto'
		});

		$image_container.css({
			width: '100%',
			height: 'auto'
		});

		if ( is_featured_image_set && props ) {
			$image.attr('src', props.src);
		}

		this.$el.find('.upfront-object-content').css({
			minHeight: '',
			maxHeight: ''
		});
		this.update_height();

	},

	unsetMobileMode: function () {
		var type = this.model.get_property_value_by_name('part_type');
		if ( type !== 'featured_image' ) return;
		var props = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
			is_featured_image_set = this.object_group_view.is_featured_image_set(),
			$image = this.$el.find('.thumbnail img'),
			$image_container = $image.parent()
		;

		this.$el.find('.upfront-entity-size-hint').hide();
		this.$el.find('.upost_thumbnail_changer').show();

		$image_container.css('width', props ? props.maskSize.width : '').css('height', props ? props.maskSize.height : '');

		$image
			.removeClass('uimage-mobile-mode')
			.css({
				position: 'relative',
				maxWidth: '',
				minHeight: 'none',
				width: props ? props.imageSize.width : '',
				height: props ? props.imageSize.height : '',
				top: props ? -props.imageOffset.top : '',
				left: props ? -props.imageOffset.left : '',
				display: 'block',
				marginTop: 0
			})
		;
		if ( is_featured_image_set && props ) {
			$image.attr('src', props.srcFull);
		}
		this.update_position();
		this.adjust_featured_image();
	},

	update_height: function () {
		var type = this.model.get_property_value_by_name('part_type');
		if ( type == 'content' || type == 'comments' || ( type == 'featured_image' && this.object_group_view.mobileMode ) ) {
			// If type is content or comments, disable min-height to prevent excessive spaces
			this.$el.find('> .upfront-object').css('min-height', '');
			this.object_group_view.$el.find('> .upfront-object-group').css('min-height', '');
			this.object_group_view.parent_module_view.$el.find('> .upfront-module').css('min-height', '');
			this.add_region_class('upfront-region-container-has-' + type, true);
		}
		if ( type == 'featured_image' && !this.object_group_view.mobileMode ) {
			this.remove_region_class('upfront-region-container-has-' + type, true);
		}


		if( this.prev_region_container )
			this.prev_region_container.removeClass( 'upfront-region-container-has-' + type );
	},

	adjust_featured_image: function () {
		var $temp_img = this.$el.find('.thumbnail img').attr('src');
		var me = this,
			$me = this.$el.find('> .upfront-editable_entity'),
			type = this.model.get_property_value_by_name('part_type'),
			baseline = Upfront.Settings.LayoutEditor.Grid.baseline,
			row = this.model.get_breakpoint_property_value('row', true),
			height = row * baseline,
			padding_top = parseInt($me.css('padding-top'), 10),
			padding_bottom = parseInt($me.css('padding-bottom'), 10)
		;
		if ( type != 'featured_image' || this.object_group_view.mobileMode ) return;
		if ( this._editor_prepared && this.editor_view ) {
			this.editor_view.updateImageSize();
		}

		var imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data');

		height -= padding_top + padding_bottom;
		this.$el.find('.thumbnail').each(function(){
			var width = $(this).width(),
				is_resize = $(this).attr('data-resize'),
				$img = $(this).find('img'),
				img = new Image(),
				img_h, img_w
			;
			$(this).css('height', height);
			// Make sure image is loaded first
			$('<img>').attr('src', $img.attr('src')).on('load', function(){
				if(_.isObject(imageData) && imageData.imageSize) {
					$img.css({
						width: imageData.imageSize.width,
						height: imageData.imageSize.height,
						top: -imageData.imageOffset.top,
						left: -imageData.imageOffset.left
					});
				}
				else if ( is_resize == "1" ) {
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
					img_h = $img.height();
					if (height != img_h) {
						$img.css('margin-top', (height - img_h) / 2);
					}
				}
			});
		});
	},

	adjust_inserted_image: function () {
		var type = this.model.get_property_value_by_name('part_type');
		if ( type != 'content' ) return;
		var me = this,
			ed = Upfront.Behaviors.GridEditor,
			pos = ed.get_position(this.$el.find('> .upfront-object')),
			left_indent = parseInt(this.object_group_view.get_preset_property('left_indent'), 10),
			right_indent = parseInt(this.object_group_view.get_preset_property('right_indent'), 10),
			max_col = pos.col - left_indent - right_indent
		;
		this.$el.find('.ueditor-insert-variant-group').each(function(){
			var vid = $(this).attr('data-variant'),
				insert = new Inserts.inserts[Inserts.TYPES.POSTIMAGE](),
				variant = insert._findVariant(vid).toJSON(),
				left = variant ? parseInt(variant.group.left, 10) : 0,
				margin_left = variant ? parseInt(variant.group.margin_left, 10) : 0,
				margin_right = variant ? parseInt(variant.group.margin_right, 10) : 0,
				variant_max_col = max_col - margin_left - margin_right,
				group_margin_left = 0,
				group_margin_right = 0
			;
			if ( variant.group['float'] ) {
				if ( 'left' == variant.group['float'] ) {
					group_margin_left = ( left_indent - Math.abs(margin_left) ) * ed.col_size;
				}
				else if ( 'right' == variant.group['float'] ) {
					group_margin_right = ( right_indent - Math.abs(margin_right) ) * ed.col_size;
				}
				else if ( 'none' == variant.group['float'] ) {
					group_margin_left = ( left_indent - Math.abs(margin_left) + Math.abs(left) ) * ed.col_size;
					variant_max_col -= left;
				}
			}
			variant_max_col = variant_max_col > pos.col ? pos.col : variant_max_col;
			$(this).css({
				marginLeft: group_margin_left > 0 ? group_margin_left : '',
				marginRight: group_margin_right > 0 ? group_margin_right : '',
				maxWidth: ((variant_max_col/pos.col)*100) + '%'
			});
		});
	},

	cleanup: function () {
		var type = this.model.get_property_value_by_name('part_type');
		this.remove_region_class('upfront-region-container-has-' + type, true);

		// We have to remove this view from _viewInstances
		if ( Upfront.Views.PostDataEditor && Upfront.Views.PostDataEditor.contentEditor && this.editor_view ) {
			Upfront.Views.PostDataEditor.contentEditor._viewInstances = _.without(
				Upfront.Views.PostDataEditor.contentEditor._viewInstances,
				this.editor_view
			);
		}
	},
	/**
	 * Sets previous region container when element is moved to a new region
	 *
	 * @event Upfront.Events::entity:drop:render
	 * @param dragdrop
	 * @param region_container
     */
	set_prev_region_container: function( dragdrop, region_container){
		this.prev_region_container = region_container;
	}

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
		this.mobileMode = false;

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
			is_locked = this.model.get_property_value_by_name('is_locked'),
			controls = [],
			lock_icon = ''
		;

		if(typeof type !== "undefined" && type === "featured_image" && !this.mobileMode) {
			if(typeof is_locked !== "undefined" && is_locked === true) {
				lock_icon = 'lock-locked';
			} else {
				lock_icon = 'lock-unlocked';
			}

			var moreOptions = new Upfront.Views.Editor.InlinePanels.SubControl();

			moreOptions.icon = 'more';
			moreOptions.tooltip = l10n.image_options;

			moreOptions.sub_items = {};
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
			type = this.model.get_property_value_by_name("data_type")
		;

		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;

		//Prepare post!
		if(Upfront.data.posts[this.postId]){
			this.post = Upfront.data.posts[this.postId];
			if(!this.post.meta.length)
				this.post.meta.fetch();
		}

		this.render_view_type();

		this.render_controls();
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

	render_controls: function () {
		var me = this,
			type = this.model.get_property_value_by_name("data_type"),
			objects = this.get_child_objects(false),
			need_rerender = ( ( objects.length > 1 && !this._multiple ) || ( objects.length == 1 && this._multiple ) )
		;
		if ( type === 'featured_image' ) {
			need_rerender = true; // If featured image, then always rerender control when requested
		}
		if ( this.parent_module_view ) {
			this.$control_el = this.$el;
			if ( this.controls && need_rerender ) {
				this.controls.remove();
				this.controls = false;
				this.$control_el.find('>.upfront-element-controls').remove();
			}
			this.updateControls();
			setTimeout(function() {
				if(me.paddingControl && typeof me.paddingControl.isOpen !== 'undefined' && !me.paddingControl.isOpen)	me.paddingControl.refresh();
			}, 300);
		}
	},

	toggle_child_objects_loading: function (loading) {
		loading = _.isUndefined(loading) ? false : loading;
		var objects = this.get_child_objects(false);

		_.each(objects, function (object) {
			var view = Upfront.data.object_views[object.cid];
			if ( !view || !view._editor_prepared || !view.editor_view ) return;
			view.editor_view.loading = loading;
		});
	},

	prepare_editor: function () {
		//this.listenTo(Upfront.Views.PostDataEditor, 'post:saved post:trash', this.on_render); // No need anymore with current post experience
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

	is_featured_image_set: function () {
		var imageId = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_id');
		return imageId ? true : false;
	},

	get_thumb_data: function() {
		if ( !this.is_featured_image_set() ) return;
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
			img: this.$('.thumbnail').find('img')
		};
	},

	setMobileMode: function () {
		if ( this.mobileMode ) return;
		this.mobileMode = true;
		this.render_controls();
		this.trigger('set:mobile_mode');
	},

	unsetMobileMode: function(){
		if ( !this.mobileMode ) return;
		this.mobileMode = false;
		this.render_controls();
		this.trigger('unset:mobile_mode');
	},

	on_element_resize_start: function(attr) {
		// Check if mobileMode
		if(this.mobileMode) {
			return;
		}

		// Check if featured image element
		var type = this.model.get_property_value_by_name("data_type"),
			is_locked = this.property('is_locked');
		if(type !== "featured_image" || !this.is_featured_image_set()) return;

		this.get_thumb_data(); // Always get thumb data so this.resizingData is fresh on each resize start

		this.$('.thumbnail').find('img').css('min-height', 'auto');

		if(this.resizingData.data.checkSize === "small" && is_locked === false) {
			// Update data
			this.resizingData.data.position = { left: 0, top: 0 };

			// Let's position image to top left corner
			this.$el.find('.thumbnail img').css({
				left: '0px',
				top: '0px',
				marginTop: 0
			});
		}
	},

	on_element_resizing: function(attr) {
		// Check if mobileMode
		if(this.mobileMode) {
			return;
		}

		// Check if featured image element
		var type = this.model.get_property_value_by_name("data_type");
		if(type !== "featured_image" || !this.is_featured_image_set()) return;

		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}

		var data = this.resizingData.data,
			img = this.$el.find('.thumbnail img'),
			// padding = this.property('no_padding') == 1 ? 0 : this.updateBreakpointPadding(breakpointColumnPadding),
			elementWidth = parseInt(attr.width, 10),
			elementHeight = parseInt(attr.height, 10),
			padding_left = parseInt( this.model.get_breakpoint_property_value("left_padding_use", true) ?  this.model.get_breakpoint_property_value('left_padding_num', true) : 0, 10 ),
			padding_right = parseInt( this.model.get_breakpoint_property_value("right_padding_use", true) ? this.model.get_breakpoint_property_value('right_padding_num', true) : 0, 10 ),
			padding_top = parseInt( this.model.get_breakpoint_property_value("top_padding_use", true) ?  this.model.get_breakpoint_property_value('top_padding_num', true) : 0, 10 ),
			padding_bottom = parseInt( this.model.get_breakpoint_property_value("bottom_padding_use", true) ? this.model.get_breakpoint_property_value('bottom_padding_num', true) : 0, 10 ),
			hPadding = padding_left + padding_right,
			vPadding = padding_top + padding_bottom,
			child_padding = this.get_child_padding(),
			childHPadding = child_padding.left + child_padding.right,
			childVPadding = child_padding.top + child_padding.bottom,
			imageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
			ratio,
			newSize
		;

		data.elementSize = {width: elementWidth < 0 ? 10 : elementWidth, height: elementHeight < 0 ? 10 : elementHeight};
		data.elementSize.width -= hPadding + childHPadding;
		data.elementSize.height -= vPadding + childVPadding;

		if(attr.axis === "e" || attr.axis === "w") {
			data.elementSize.height = data.elementSize.height;
		}

		newSize = this.getElementShapeSize(data.elementSize);
		if ( false !== newSize ) {
			data.elementSize = newSize;
		}

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
				horizontal_align = imageData.align,
				current_position = imageData.imageOffset,
				isDotAlign = imageData.isDotAlign,
				containerHeight = this.$('.upostdata-part.thumbnail').height(),
				containerWidth = this.$('.upostdata-part.thumbnail').width(),
				leftPadding = parseInt(this.$el.find('.upfront-post-data-part').css('padding-left'), 10),
				rightPadding = parseInt(this.$el.find('.upfront-post-data-part').css('padding-right'), 10),
				padding = leftPadding + rightPadding,
				sizeCheck = this.checkSize(),
				imgPosition = img.position(),
				maskSize = this.getMaskSize(attr),
				imageView = this.getImageViewport(),
				originalImageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data'),
				marginLeft = current_position.left,
				marginTop;

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

			if(sizeCheck === "small" && !!isDotAlign) {
				if(horizontal_align === "center") {
					if(data.size.width < attr.width) {
						marginLeft = (data.size.width - attr.width) / 2;
					} else {
						marginLeft = -(attr.width - containerWidth) / 2;
					}
				}

				if(horizontal_align === "right") {
					if(data.size.width < attr.width) {
						marginLeft = (data.size.width - attr.width);
					} else {
						marginLeft = -(attr.width - containerWidth);
					}
				}

				if(vertical_align === "center") {
					if(data.size.height < data.elementSize.height) {
						marginTop = (data.size.height - data.elementSize.height) / 2;
					} else {
						marginTop = -(data.elementSize.height - containerHeight) / 2;
					}
				}

				if(vertical_align === "bottom") {
					if(data.size.height < data.elementSize.height) {
						marginTop = (data.size.height - data.elementSize.height);
					} else {
						marginTop = -(data.elementSize.height - containerHeight);
					}
				}

				var offset = { top: marginTop, left: marginLeft + padding },
					img = this.$el.find('.thumbnail img')
				;

				this.property('position', { top: marginTop, left: marginLeft + padding });

				// Update position and resize
				newImageData = _.extend(originalImageData, {
					'imageOffset': { top: marginTop, left: marginLeft + padding },
					'position': { top: marginTop, left: marginLeft + padding }
				});

				Upfront.Events.trigger("featured:image:resized", newImageData);

				img.css('top', -offset.top);
				img.css('left', -offset.left);
			}
		}
	},

	on_element_resize: function (attr) {
		if(typeof this.resizingData === "undefined") {
			this.get_thumb_data();
		}

		// Check if featured image element
		var type = this.model.get_property_value_by_name("data_type"),
			objects = this.get_child_objects(false),
			breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
			grid = Upfront.Settings.LayoutEditor.Grid,
			padding_left = parseInt( this.model.get_breakpoint_property_value("left_padding_use", true) ?  this.model.get_breakpoint_property_value('left_padding_num', true) : 0, 10 ),
			padding_right = parseInt( this.model.get_breakpoint_property_value("right_padding_use", true) ? this.model.get_breakpoint_property_value('right_padding_num', true) : 0, 10 ),
			padding_top = parseInt( this.model.get_breakpoint_property_value("top_padding_use", true) ?  this.model.get_breakpoint_property_value('top_padding_num', true) : 0, 10 ),
			padding_bottom = parseInt( this.model.get_breakpoint_property_value("bottom_padding_use", true) ? this.model.get_breakpoint_property_value('bottom_padding_num', true) : 0, 10 ),
			row = attr.row - parseInt(padding_top/grid.baseline, 10) - parseInt(padding_bottom/grid.baseline, 10)
		;

		if(type === "featured_image" && this.is_featured_image_set() && !this.mobileMode) {
			//Save image
			var img = this.$el.find('img'),
				imgSize = {width: img.width(), height: img.height()},
				imgPosition = img.position(),
				hPadding = padding_left + padding_right,
				vPadding = padding_top + padding_bottom,
				child_padding = this.get_child_padding(),
				childHPadding = child_padding.left + child_padding.right,
				childVPadding = child_padding.top + child_padding.bottom,
				elementWidth = parseInt(attr.width, 10),
				elementHeight = parseInt(attr.height, 10),
				elementSize = {width: elementWidth < 0 ? 10 : elementWidth, height: elementHeight < 0 ? 10 : elementHeight}
			;

			// Update maskSize
			maskSize = { width: attr.width, height: attr.height };

			// Change the sign
			imgPosition.top = -imgPosition.top;
			imgPosition.left = -imgPosition.left;

			elementSize.width -= hPadding + childHPadding;
			elementSize.height -= vPadding + childVPadding;

			this.temporaryProps = {
				size: imgSize,
				maskSize: maskSize,
				position: imgPosition
			};

			// Save image crop from resize
			this.saveTemporaryResizing(elementSize);
		}

		// Also resize child objects if it's only one object
		if ( objects.length != 1 ) return;
		if ( breakpoint['default'] ) {
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

	after_breakpoint_change: function(){
		var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
			type = this.model.get_property_value_by_name("data_type")
		;
		if ( breakpoint && !breakpoint['default'] ) {
			this.setMobileMode();
		} else {
			this.unsetMobileMode();
		}
		this.render_controls(); // Update the controls
	},

	get_child_padding: function () {
		var column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
			child_objects = this.get_child_objects(false),
			child = child_objects.length == 1 ? child_objects[0] : false,
			padding_left = child ? parseInt( child.get_breakpoint_property_value("left_padding_use", true) ? child.get_breakpoint_property_value('left_padding_num', true) : column_padding, 10 ) : column_padding,
			padding_right = child ? parseInt( child.get_breakpoint_property_value("right_padding_use", true) ? child.get_breakpoint_property_value('right_padding_num', true) : column_padding, 10 ) : column_padding,
			padding_top = child ? parseInt( child.get_breakpoint_property_value("top_padding_use", true) ? child.get_breakpoint_property_value('top_padding_num', true) : column_padding, 10 ) : column_padding,
			padding_bottom = child ? parseInt( child.get_breakpoint_property_value("bottom_padding_use", true) ? child.get_breakpoint_property_value('bottom_padding_num', true) : column_padding, 10 ) : column_padding
		;
		return {
			left: padding_left,
			right: padding_right,
			top: padding_top,
			bottom: padding_bottom
		};
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
			originalImageData = Upfront.Views.PostDataEditor.post.meta.getValue('_thumbnail_data')
		;

		crop.top = position.top;
		crop.left = position.left;

		crop.width = Math.min(elementSize.width, resize.width);
		crop.height = Math.min(elementSize.height, resize.height);

		// Update position and resize
		newImageData = _.extend(originalImageData, {
			'imageSize': resize,
			'imageOffset': position,
			'position': position,
			'maskSize': this.temporaryProps.maskSize
		});

		Upfront.Events.trigger("featured:image:resized", newImageData);

		import_promise.done(function(){
			imageId = me.resizingData.data.imageId;
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
					'gifImage': imageData.gif,
					'maskSize': me.temporaryProps.maskSize,
					'cropBig': me.resizingData.data.cropBig
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
	}

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
					{ name: 'wrapper_id', value: wrapper_id }
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
		name: l10n.part_post_data
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
		name: l10n.part_author
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
		name: l10n.part_cats_and_tags
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
		name: l10n.part_featured_image,
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
		name: l10n.part_comments
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
		name: l10n.part_meta
	},
	_post_parts: [
		'meta'
	]
});

/**
 * Add the elements to Upfront, only when in single layout. Place the element in DataElement.
 */
function add_elements () {
	if ( Upfront.Application.is_single() && !Upfront.Application.is_single('404_page') ) {
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
				'.author-bio': {label: l10n.css.author_bio_label, info: l10n.css.author_bio_info}
			},
			cssSelectorsId: 'post_author'
		});

		if( !Upfront.Application.is_single("page") )
			Upfront.Application.LayoutEditor.add_object("Upostdata-taxonomy", {
				"Model": PostDataModel,
				"View": PostDataView,
				"DataElement": PostDataElement_Taxonomy,
				"Settings": PostDataSettings,
				cssSelectors: {
					'.post_tags': {label: l10n.css.taxonomy_tags_label, info: l10n.css.taxonomy_tags_info},
					'.post_tags a': {label: l10n.css.taxonomy_tags_link_label, info: l10n.css.taxonomy_tags_link_info},
					'.post_categories': {label: l10n.css.taxonomy_category_label, info: l10n.css.taxonomy_category_info},
					'.post_categories a': {label: l10n.css.taxonomy_category_link_label, info: l10n.css.taxonomy_category_link_info}
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
				'.thumbnail img': {label: l10n.css.featured_thumbnail_img_label, info: l10n.css.featured_thumbnail_img_info}
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
				'.comment-respond .form-submit .submit': {label: l10n.css.submit_button, info: l10n.css.submit_button}
			},
			cssSelectorsId: 'post_comments'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-meta", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Meta,
			"Settings": PostDataSettings,
			cssSelectors: {
				'.meta': {label: l10n.css.post_meta_label, info: l10n.css.post_meta_info}
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
