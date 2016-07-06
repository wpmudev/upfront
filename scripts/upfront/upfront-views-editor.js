(function ($) {

	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;

	define([
		"chosen",
		"scripts/upfront/global-event-handlers",
		"scripts/upfront/inline-panels/inline-panels",
		"scripts/upfront/element-settings/sidebar",
		"scripts/upfront/link-panel", // If adding more arguments adjust _.rest in line 72
		"upfront/post-editor/upfront-post-edit",
		"scripts/upfront/upfront-views-editor/jquery-plugins",
		"scripts/upfront/upfront-views-editor/mixins",
		"scripts/upfront/upfront-views-editor/fields",
		"scripts/upfront/upfront-views-editor/fonts",
		"scripts/upfront/upfront-views-editor/theme-colors",
		"scripts/upfront/upfront-views-editor/modal",
		"scripts/upfront/upfront-views-editor/modal-bg-setting",
		"scripts/upfront/upfront-views-editor/settings",
		"scripts/upfront/upfront-views-editor/css",
		"scripts/upfront/upfront-views-editor/breakpoint",
		"scripts/upfront/upfront-views-editor/region",
		"scripts/upfront/upfront-views-editor/commands",
		"scripts/upfront/upfront-views-editor/topbar",
		"scripts/upfront/upfront-views-editor/notifier",
		"scripts/upfront/upfront-views-editor/loading",
		"text!upfront/templates/property.html",
		"text!upfront/templates/properties.html",
		"text!upfront/templates/property_edit.html",
		"text!upfront/templates/overlay_grid.html",
		"text!upfront/templates/edit_background_area.html",
		"text!upfront/templates/sidebar_settings_lock_area.html",
		"text!upfront/templates/sidebar_settings_background.html",
		"text!upfront/templates/popup.html",
		"text!upfront/templates/region_add_panel.html",
		"text!upfront/templates/region_edit_panel.html",
		"text!upfront/templates/sidebar_settings_theme_colors.html",
		"text!upfront/templates/color_picker.html",
		'spectrum'
	], function (
			chosen,
			globalEventHandlers,
			InlinePanelsLoader,
			ElementSettingsSidebar,
			LinkPanel,
			PostEditorBox,
			__jquery_plugins,
			Mixins,
			Fields,
			Fonts,
			Theme_Colors,
			Modal,
			ModalBgSetting,
			Settings,
			CSS,
			BreakPoint,
			Region,
			Commands,
			Topbar,
			notifier,
			Loading
	) {
		var _template_files = [
			"text!upfront/templates/property.html",
			"text!upfront/templates/properties.html",
			"text!upfront/templates/property_edit.html",
			"text!upfront/templates/overlay_grid.html",
			"text!upfront/templates/edit_background_area.html",
			"text!upfront/templates/sidebar_settings_lock_area.html",
			"text!upfront/templates/sidebar_settings_background.html",
			"text!upfront/templates/popup.html",
			"text!upfront/templates/region_add_panel.html",
			"text!upfront/templates/region_edit_panel.html",
			"text!upfront/templates/sidebar_settings_theme_colors.html",
			"text!upfront/templates/color_picker.html"
		];

		// Auto-assign the template contents to internal variable
		var _template_args = _.rest(arguments, 21),
			_Upfront_Templates = {}
			;
		_(_template_files).each(function (file, idx) {
			if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
		});

		var InlinePanels = InlinePanelsLoader;


		var Field = Fields.Field,
			Field_Text =  Fields.Text,
			Field_Button = Fields.Button,
			Field_Email = Fields.Email,
			Field_Textarea = Fields.Textarea,
			Field_Color = Fields.Color,
			Field_Multiple_Suggest = Fields.Multiple_Suggest,
			Field_Chosen_Select = Fields.Chosen_Select,
			Field_Typeface_Chosen_Select = Fields.Typeface_Chosen_Select,
			Field_Typeface_Style_Chosen_Select = Fields.Typeface_Style_Chosen_Select,
			Field_Multiple_Chosen_Select = Fields.Multiple_Chosen_Select,
			Field_Number = Fields.Number,
			Field_Slider = Fields.Slider,
			Field_Select = Fields.Select,
			Field_Radios = Fields.Radios,
			Field_Checkboxes = Fields.Checkboxes,
			Field_Hidden = Fields.Hidden,
			Field_Anchor = Fields.Anchor,
			OptionalField = Fields.Optional
		;


		Upfront.Events.on('data:ready', function(){
			Upfront.data.tpls = _Upfront_Templates;
		});



		// Stubbing interface control

		var Property = Backbone.View.extend({
			events: {
				"click .upfront-property-change": "show_edit_property_partial",
				"click .upfront-property-save": "save_property",
				"click .upfront-property-remove": "remove_property"
			},
			render: function () {
				var template = _.template(_Upfront_Templates.property, this.model.toJSON());
				this.$el.html(template);
			},

			remove_property: function () {
				this.model.destroy();
			},
			save_property: function () {
				var name = this.$("#upfront-new_property-name").val(),
					value = this.$("#upfront-new_property-value").val()
					;
				this.model.set({
					"name": name,
					"value": value
				});
				this.render();
			},
			show_edit_property_partial: function () {
				var template = _.template(_Upfront_Templates.property_edit, this.model.toJSON());
				this.$el.html(template);
			}
		});

		var Properties = Backbone.View.extend({
			events: {
				"click #add-property": "show_new_property_partial",
				"click #done-adding-property": "add_new_property"
			},
			initialize: function () {
				/*
				 this.model.get("properties").bind("change", this.render, this);
				 this.model.get("properties").bind("add", this.render, this);
				 this.model.get("properties").bind("remove", this.render, this);
				 */

				this.listenTo(this.model.get("properties"), 'change', this.render);
				this.listenTo(this.model.get("properties"), 'add', this.render);
				this.listenTo(this.model.get("properties"), 'remove', this.render);
			},
			render: function () {
				var template = _.template(_Upfront_Templates.properties, this.model.toJSON()),
					properties = this
					;
				this.$el.html(template);
				this.model.get("properties").each(function (obj) {
					var local_view = new Property({"model": obj});
					local_view.render();
					properties.$el.find("dl").append(local_view.el);
				});
			},

			show_new_property_partial: function () {
				this.$("#add-property").hide();
				this.$("#upfront-new_property").slideDown();
			},
			add_new_property: function () {
				var name = this.$("#upfront-new_property-name").val(),
					value = this.$("#upfront-new_property-value").val()
					;
				this.model.get("properties").add(new Upfront.Models.Property({
					"name": name,
					"value": value
				}));
				this.$("#upfront-new_property")
					.slideUp()
					.find("input").val('').end()
				;
				this.$("#add-property").show();
			}
		});


		/**
		 * DEPRECATED
		 */
		var ResponsiveCommand_BrowseLayout = Commands.Command.extend({
			className: "command-browse-layout command-browse-layout-responsive",
			render: function () {
				this.$el.html('<span title="'+ l10n.browse_layouts +'">' + l10n.browse_layouts + '</span>');
			},
			on_click: function () {
				Upfront.Events.trigger("command:layout:browse");
			}
		});



// ----- Done bringing things back


		var ButtonPresetModel = Backbone.Model.extend({
			initialize: function(attributes) {
				this.set({ presets: attributes });
			}
		});
		var ButtonPresetsCollection = Backbone.Collection.extend({
			model: ButtonPresetModel
		});

		var button_presets_collection = new ButtonPresetsCollection(Upfront.mainData.buttonPresets);

		var Button_Presets_Storage = function(stored_presets) {
			var button_presets;

			var initialize = function() {
				// When more than one weights are added at once don't send bunch of server calls
				var save_button_presets_debounced = _.debounce(save_button_presets, 100);
				button_presets_collection.on('add remove edit', save_button_presets_debounced);
			};

			var save_button_presets = function() {
				var postData = {
					action: 'upfront_update_button_presets',
					button_presets: button_presets_collection.toJSON()
				};

				Upfront.Util.post(postData)
					.error(function(){
						return notifier.addMessage(l10n.button_presets_save_fail);
					});
			};

			initialize();
		};
		var button_presets_storage = new Button_Presets_Storage();

		var ButtonPresetModel = Backbone.Model.extend();
		var ButtonPresetsCollection = Backbone.Collection.extend({
			model: ButtonPresetModel
		});

		var button_presets_collection = new ButtonPresetsCollection(Upfront.mainData.buttonPresets);


		var PostSelectorNavigation = ContentEditorPagination.extend({
			className: 'upfront-selector-navigation',
			handle_pagination_request: function (e, page) {
				var me = this,
					pagination = this.collection.pagination,
					page = page ? page : parseInt($(e.target).attr("data-page_idx"), 10) || 0
					;
				this.options.pageSelection(page);
			}
		});

		var PostSelector = Backbone.View.extend({
			postTypeTpl: _.template($(_Upfront_Templates.popup).find('#selector-post_type-tpl').html()),
			postListTpl: _.template($(_Upfront_Templates.popup).find('#selector-post-tpl').html()),
			postType: 'post',
			posts: [],
			pagination: false,
			selected: false,
			deferred: false,
			popup: false,
			defaultOptions: {
				// Title for the top
				title: l10n.select_content_to_link,
				postTypes: [
					{name: 'post', label: l10n.posts},
					{name: 'page', label: l10n.pages}
				]
			},
			events: {
				'click .upfront-field-select-value': 'openTypesSelector',
				'click .upfront-field-select-option': 'selectType',
				'click .upfront-selector-post': 'selectPost',
				'click .use': 'postOk',
				'click #upfront-search_action': 'search',
				'keyup .search_container>input': 'inputSearch'
			},
			initialize: function () {
				if (("post_types" in Upfront.mainData.content_settings ? Upfront.mainData.content_settings : {post_types: []}).post_types.length) {
					this.defaultOptions.postTypes = Upfront.mainData.content_settings.post_types;
				}
			},
			open: function(options){
				var me = this,
				bindEvents = false
				;

				options = _.extend({}, this.defaultOptions, options);

				if(!$("#upfront-popup").length && this.$el.attr('id') != 'upfront-popup')
					bindEvents = true;

				this.popup = Upfront.Popup.open(function(){});

				this.deferred = $.Deferred();

				this.posts = new Upfront.Collections.PostList([], {postType: 'page'});

				this.posts.pagination.pageSize = 20;
				this.pagination = new PostSelectorNavigation({
					collection: this.posts,
					pageSelection: function(page){
						me.fetch({page: page});
					}
				});

				this.setElement($('#upfront-popup'));

				this.$('#upfront-popup-top').html('<h3 class="upfront-selector-title">' + options.title +'</h3>');
				this.$('#upfront-popup-content').html(this.postTypeTpl(options));

				this.fetch({});

				this.$('#upfront-popup-bottom')
					.html('<div class="use_selection_container inactive"><a href="#use" class="use">'+ Upfront.Settings.l10n.global.content.ok +'</a></div><div class="search_container clearfix"><input type="text" placeholder="' + l10n.search + '" value=""><div class="search upfront-icon upfront-icon-popup-search" id="upfront-search_action"></div></div>')
					.append(this.pagination.$el)
				;
				$('#upfront-popup').addClass('upfront-postselector-popup');

				this.$('.upfront-field-select-value').text(l10n.pages);
				return this.deferred.promise();
			},

			openTypesSelector: function(){
				var selector = this.$('.upfront-field-select');
				if(!selector.hasClass('open')) {
					selector.addClass('open');
				}
				else {
					selector.removeClass('open');
				}
			},

			selectType: function(e){
				var type = $(e.target).attr('rel');
				if(type != this.posts.postType){
					this.$('.upfront-field-select-value').text($(e.target).text());
					this.$('.upfront-field-select').removeClass('open');
					this.fetch({postType: type});
				}
			},

			selectPost: function(e){
				var post = $(e.currentTarget);
				this.$('.upfront-selector-post.selected').removeClass('selected');

				this.selected = $(e.currentTarget).addClass('selected').attr('rel');
				this.$('.use_selection_container').removeClass('inactive');
			},

			postOk: function(e){
				e.preventDefault();
				if(!this.selected)
					return;

				Upfront.Popup.close();
				return this.deferred.resolve(this.posts.get(this.selected));
			},

			fetch: function(options){
				var me = this,
					loading = new Loading({
						loading: l10n.loading,
						done: l10n.thank_you_for_waiting,
						fixed: false
					})
					;

				this.$('.use_selection_container').addClass('inactive');
				this.selected = false;

				loading.render();
				this.$('#upfront-selector-posts').append(loading.$el);

				if(options.postType && options.postType != this.posts.postType){
					options.flush = true;
					this.posts.postType = options.postType;
				}

				var page = options.page;
				if(!page)
					page = 0;

				this.posts.fetchPage(page, options).done(function(pages){
					loading.done();
					me.$('#upfront-selector-posts').find('table').remove();
					me.$('#upfront-selector-posts').append(me.postListTpl({posts: me.posts.getPage(page)}));
					me.pagination.render();
				});
			},

			search: function(e){
				e.preventDefault();
				var s = this.$('.search_container input').val();
				if(s){
					this.fetch({search: s, flush: true});
				}
				else
					this.$('.search_container input').focus();
			},
			inputSearch: function(e){
				if(e.which == 13)
					this.search(e);
			}
		});


		return {
			"Editor": {
				"Property": Property,
				"Properties": Properties,
				"Commands": Commands.Commands,
				"Command": Commands.Command,
				"Command_SaveLayout": Commands.Command_SaveLayout,
				"Command_SavePostLayout": Commands.Command_SavePostLayout,
				"Command_CancelPostLayout": Commands.Command_CancelPostLayout,
				"Command_Undo": Commands.Command_Undo,
				"Command_ToggleGrid": Commands.Command_ToggleGrid,
				"Command_Merge": Commands.Command_Merge,
				"Settings": Settings,
				"Button": {
					"Presets": button_presets_collection
				},
				"Fonts": Fonts,
				"Field": Fields,
				"Sidebar": {
					"Sidebar": Sidebar,
					"Panel": SidebarPanel,
					"Element": DraggableElement
				},
				"Topbar": {
					"Topbar": Topbar
				},
				notify : function(message, type, duration){
					notifier.addMessage(message, type, duration);
				},
				"Loading": Loading,
				"Modal": Modal,
				"ModalBgSetting": ModalBgSetting,
				"PostSelector": new PostSelector(),
				InlinePanels: InlinePanels,
				"RegionPanels": Region.RegionPanels,
				"RegionPanelsAddRegion": Region.RegionPanelItemAddRegion,
				"RegionFixedPanels": Region.RegionFixedPanels,
				"RegionFixedEditPosition" : Region.RegionFixedEditPosition,
				"CSSEditor": CSS.CSSEditor,
				"Insert_Font_Widget": Fonts.Insert_Font_Widget,
				"GeneralCSSEditor": CSS.GeneralCSSEditor,
				"LinkPanel": LinkPanel
			},
			Mixins: Mixins,
			Theme_Colors : Theme_Colors,
			breakpoints_storage: BreakPoint.storage,
			Font_Model: Fonts.Model
		};
	});
})(jQuery);

//# sourceURL=upfront-views-editor.js
