(function ($) {
  define([
		'scripts/upfront/element-settings/settings',
		'scripts/upfront/element-settings/root-settings-panel'
	], function(ElementSettings, RootSettingsPanel) {

	var l10n = Upfront.Settings.l10n.like_box_element;

	/**
	 * Define the model - initialize properties to their default values.
	 * @type {Upfront.Models.ObjectModel}
	 */

	var LikeBoxModel = Upfront.Models.ObjectModel.extend({
		/**
		 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
		 * Used for setting up instance defaults, initialization and the like.
		 */
		init: function () {
			var properties = _.clone(Upfront.data.ulikebox.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
			this.init_properties(properties);
		}
	});

	/**
	 * View instance - what the element looks like.
	 * @type {Upfront.Views.ObjectView}
	 */
	var LikeBoxView = Upfront.Views.ObjectView.extend({

		model: LikeBoxModel,
		elementSize: {width: 0, height: 0},

		initialize: function(options){
			if(! (this.model instanceof LikeBoxModel)){
				this.model = new LikeBoxModel({properties: this.model.get('properties')});
			}

			this.constructor.__super__.initialize.call(this, [options]);

			this.listenTo(Upfront.Events, 'entity:resize_start', this.hideFrame);
			this.listenTo(Upfront.Events, 'entity:resize_stop', this.onElementResize);
		},
		
		on_element_resize_start: function (attr) {
			this.hideFrame(this, this.model);
		},
		
		on_element_resize: function (attr) {
			this.onElementResize(this, this.model);
		},

		setUrl: function(){
			this.property('facebook_url' , Upfront.data.social.panel.model.get_property_value_by_name('global_social_media_services-facebook-url'));
		},
		hideFrame: function(view, model) {
			if (this.parent_module_view == view) {
				this.$el.find('iframe').css('display', 'none');
			}
		},
		showFrame: function () {
			var $frame = this.$el.find("iframe");
			if (!$frame.is(":visible")) $frame.show();
		},
		onElementResize: function(view, model){
			this.setElementSize();
			this.showFrame();
		},
		setElementSize: function(){
			var me = this,
				parent = this.parent_module_view.$('.upfront-editable_entity:first')
				;
			if(parent.length && parent.height()){
				this.elementSize.height = parent.height();
				//setTimeout(function(){
					var size = me.get_element_size_px(false);
					if(size.row === 0) {
						size.row = parent.height();
					}

					if(size.col != 0){
						me.property('element_size', {
							width: size.col,
							height: size.row,
						});
					}

				//}, 1000);
			}
		},
		property: function(name, value) {
			if(typeof value != "undefined")
				return this.model.set_property(name, value);
			return this.model.get_property_value_by_name(name);
		},
		events: function(){
			return _.extend({},Upfront.Views.ObjectView.prototype.events,{
				'click a.back_global_settings' : 'backToGlobalSettings'
			});
		},
		backToGlobalSettings: function(e){
			e.preventDefault();
			Upfront.data.social.panel.popupFunc();
		},

		getGlobalFBUrl: function(){
			if(!Upfront.data.usocial.globals)
				return false;
			var services = Upfront.data.usocial.globals.services,
				url = false;

			_(services).each( function( s ) {
				if(s.id == 'facebook')
					url = s.url;
			});

			return url;
		},

		/**
		 * Element contents markup.
		 * @return {string} Markup to be shown.
		 */
		get_content_markup: function () {
			var me = this,

			fbUrl = this.model.get_property_value_by_name('facebook_url');

			//if(!fbUrl || fbUrl=='')
			//	fbUrl = this.getGlobalFBUrl();

			if(fbUrl){
				var splitted = fbUrl.split('/');
				var pageName = _.last(splitted);

				if(_.isEmpty(pageName)) {
					splitted.splice(splitted.length-1, 1);
					pageName = _.last(splitted);
				}

				var wide = 	this.model.get_property_value_by_name('element_size').width-30;

				if(wide>500)
					wide=500;

				/*if(wide%53 > 0)
					wide = parseInt(wide/53)*53+22;
				else
					wide = this.model.get_property_value_by_name('element_size').width;
				*/
				//return '<iframe src="//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F'+ (pageName ? pageName : 'wpmudev' )+'&amp;width='+wide+'&amp;height='+this.model.get_property_value_by_name('element_size').height+'&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false" scrolling="no" frameborder="0" style="border:none; overflow:hidden; float:left; width:'+wide+'px; height:'+this.model.get_property_value_by_name('element_size').height+'px;"" allowTransparency="true"></iframe><div class="upfront-like-box_overlay"></div>'+ (!pageName ? '<span class="alert-url">!</span>' : '' );


				var hide_cover = this.model.get_property_value_by_name('hide_cover')=='yes'?'true':'false';
				var show_friends = this.model.get_property_value_by_name('show_friends')=='yes'?'true':'false';
				var small_header = this.model.get_property_value_by_name('small_header')=='yes'?'true':'false';
				var show_posts = this.model.get_property_value_by_name('show_posts')=='yes'?'true':'false';

				return '<iframe src="//www.facebook.com/v2.5/plugins/page.php?adapt_container_width=true&amp;container_width='+wide+'&amp;width='+wide+'&amp;height='+(this.model.get_property_value_by_name('element_size').height-30)+'&amp;hide_cover='+hide_cover+'&amp;href=https%3A%2F%2Fwww.facebook.com%2F'+ (pageName ? pageName : 'wpmudev' )+'&amp;show_facepile='+show_friends+'&amp;show_posts='+show_posts+'&amp;small_header='+small_header+'" scrolling="no" frameborder="0" style="border:none; display:block; overflow:hidden; margin:auto; width:'+wide+'px; height:'+(this.model.get_property_value_by_name('element_size').height-30)+'px;"" allowTransparency="true"></iframe><div class="upfront-like-box_overlay"></div>'+ (!pageName ? '<span class="alert-url">!</span>' : '' );

			} else {
				this.model.set_property('facebook_url', '', true);
				if (Upfront.Application.user_can_modify_layout()) {
					return '<div class="upfront-likebox-overlay upfront-initial-overlay-wrapper" style="min-height: 200px;">' +
							'<div class="upfront-like-box_placeholder upfront-initial-overlay-wrapper" style="height: 150px;">' +
							'<div class="upfront-like-box_placeholder_guide">'+l10n.placeholder_guide+'</div>' +
							'<div class="upfront-like-box_url_wrapper"><input type="text" class="upfront-like-box_url" placeholder="' + l10n.placeholder + '" /></div>' +
							'<button type="button" class="upfront-like-box_button">'+l10n.ok+'</button></div></div>';
				} else {
					return '';
				}
			}
		},

		on_render: function(){
			var parent = this.parent_module_view, me = this;
			
			this.setElementSize();

			//Prevent iframe hijacking of events when dragging
			if(!parent.$el.data('dragHandler')){
				parent.$el.on('dragstart', this.coverIframe);
				parent.$el.data('dragHandler', true);
			}

			this.$el.find('.upfront-like-box_button').on('click', function(e) {
				me.property('facebook_url', $(this).parent().find('input.upfront-like-box_url').val());
			});
			this.$el.find('.upfront-like-box_url').on('keydown', function(e) {
				if(e.which == 13) {
					me.$el.find('.upfront-like-box_button').click();
					Upfront.Events.trigger("upfront:element:edit:stop");
				}
			});
		},

		on_after_layout_render: function () {
			this.setElementSize();
		},

		//Prevent iframe hijacking of events when dragging
		coverIframe: function(e, ui){
			ui.helper.append('<div class="upfront-iframe-draggable" style="width:100%;height:100%;position:absolute;top:0;left:0:z-index:1"></div>');
		}

	});

	/**
	 * Sidebar element class - this let you inject element into
	 * sidebar elements panel and allow drag and drop element adding
	 * @type {Upfront.Views.Editor.Sidebar.Element}
	 */
	var LikeBoxElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 100,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-likebox');
			this.$el.html(l10n.element_name);
		},
		add_element: function () {
			var object = new LikeBoxModel(),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c7 upfront-like-box_module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(200)}
					],
					"objects": [
						object // The anonymous module will contain our search object model
					]
				});
			// We instantiated the module, add it to the workspace
			this.add_module(module);
		}
	});


	// ----- Settings API -----
	// We'll be working from the bottom up here.
	// We will first define settings panels, and items for each panel.
	// Then we'll slot in the panels in a settings instance.

	/**
	 * Layout Style settings - Facebook Page URL item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */

	/**
	 * Social Media settings hub, populated with the panels we'll be showing.
	 * @type {Upfront.Views.Editor.Settings.Settings}
	 */
	var GeneralPanel = RootSettingsPanel.extend({
		className: 'uyoutube-settings',
		tabbed: false,
		title: l10n.general_settings,
		initialize: function (opts) {
			this.options = opts;
			
			me = this,
			SettingsItem =  Upfront.Views.Editor.Settings.Item,
			Fields = Upfront.Views.Editor.Field
			;

			this.settings = _([
				new SettingsItem({
					className: 'upfront-social-services-item general_settings_item',
					title: l10n.facebook_account,
					label: l10n.opts.page_url,
					fields: [
						new Fields.Text({
							model: this.model,
							className: 'facebook-url',
							property: 'facebook_url',
							label: l10n.opts.url_sample,
							compact: true,
							change: function(value) {
								this.model.set_property('facebook_url', value);
							}
						}),

						new Fields.Checkboxes({
							model: this.model,
							className: 'show-friends',
							property: 'show_friends',
							label: "",
							values: [
								{ label: l10n.opts.show_friends, value: 'yes' }
							],
							change: function(value) {
								this.model.set_property('show_friends', value);
							}
						}),

						new Fields.Checkboxes({
							model: this.model,
							className: 'small-header',
							property: 'small_header',
							label: "",
							values: [
								{ label: l10n.opts.small_header, value: 'yes' }
							],
							change: function(value) {
								this.model.set_property('small_header', value);
							}
						}),

						new Fields.Checkboxes({
							model: this.model,
							className: 'hide-cover',
							property: 'hide_cover',
							label: "",
							values: [
								{ label: l10n.opts.hide_cover, value: 'yes' }
							],
							change: function(value) {
								this.model.set_property('hide_cover', value);
							}
						}),

						new Fields.Checkboxes({
							model: this.model,
							className: 'show-posts',
							property: 'show_posts',
							label: "",
							values: [
								{ label: l10n.opts.show_posts, value: 'yes' }
							],
							change: function(value) {
								this.model.set_property('show_posts', value);
							}
						}),

						new Upfront.Views.Editor.Settings.Settings_CSS({model: this.model }),
					]
				})
			]);
		},

		get_title: function () {
			return l10n.general_settings;
		},
	});
	var LikeBoxSettings = ElementSettings.extend({
		panels: {
			'General': GeneralPanel
		},
		title: l10n.settings
	});



// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

	Upfront.Application.LayoutEditor.add_object("LikeBox", {
			"Model": LikeBoxModel,
			"View": LikeBoxView,
			"Element": LikeBoxElement,
			"Settings": LikeBoxSettings,
			cssSelectors: {
				'iframe': {label: l10n.container_label, info: l10n.container_info}
			},
			cssSelectorsId: Upfront.data.ulikebox.defaults.type
	});

	Upfront.Models.LikeBoxModel = LikeBoxModel;
	Upfront.Views.LikeBoxView = LikeBoxView;

  });

})(jQuery);
