(function ($) {

define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-comment/templates/preset-style.html'
], function(ElementSettings, Util, styleTpl) {

var l10n = Upfront.Settings.l10n.comments_element;

var UcommentModel = Upfront.Models.ObjectModel.extend({
	/**
	 * The init function is called after the contructor and Model intialize.
	 * Here the default values for the model properties are set.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.ucomments.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var UcommentView = Upfront.Views.ObjectView.extend({
	initialize: function(options){
		if(! (this.model instanceof UcommentModel)){
			this.model = new UcommentModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
	},

	get_content_markup: function () {
		var comment_data = $(document).data('upfront-comment-' + _upfront_post_data.post_id);
		return comment_data ? comment_data : l10n.loading;
	},

	on_render: function () {
		if ( !$(document).data('upfront-comment-' + _upfront_post_data.post_id) ) {
			this._get_comment_markup();
		}
		if ( Upfront.Settings.Application.PERMS.OPTIONS ) {
			var discussion_settings = new DiscussionSettings_View({model: this.model});
			discussion_settings.render();
			this.$el.append(discussion_settings.$el);
		}
	},

	_get_comment_markup: function () {
		var me = this,
			post_id = _upfront_post_data.post_id
		;
		if (!post_id && "themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.THEME) {
			post_id = 'fake_post';
		}
		Upfront.Util.post({"action": "ucomment_get_comment_markup", "data": JSON.stringify({"post_id": post_id})})
			.success(function (ret) {
				var html = ret.data.replace(/<script.*?>.*?<\/script>/gim, ''); // strip script
				$(document).data('upfront-comment-' + _upfront_post_data.post_id, html || '&nbsp;');
				me.render();
			})
			.error(function (ret) {
				Upfront.Util.log(l10n.loading_error);
			})
		;
	}
});

var DiscussionSettings_Model = Upfront.Models.ObjectModel.extend({
	cache: false,
	load: function () {
		this.loading = $.Deferred();
		if (this.cache) {
			this._populate();
		} else {
			var me = this;
			Upfront.Util.post({action: "upfront-discussion_settings-get"}).done(function (response) {
				me.cache = response.data;
				me._populate();
			});
		}
		return this.loading;
	},
	_populate: function () {
		if (!(_.isObject(this.cache) && "avatar_defaults" in this.cache)) {
			this.loading.reject();
			return false;
		}
		var avatars = _(this.cache.avatar_defaults).map(function (avatar) {
			if (avatar.icon) avatar.icon = avatar.icon.match(/^https?:\/\//) ? avatar.icon : $(avatar.icon).attr("src");
			return avatar;
		});
		this.set({
			properties: new Upfront.Collections.Properties(_(this.cache.properties).values()),
			avatars: _(avatars).values()
		});
		this.loading.resolve();
	}
});

var GlobalSettings_View = Backbone.View.extend({
	className: "upfront-global_settings",
	events: {
		"click a.settings": "popup_open"
	},
	initialize: function() {
		Upfront.Events.on("popup:closed", this.onPopupClosed, this);
	},
	onPopupClosed: function() {
		//Remove discussion-settings-wrapper when dicussion settings popup is closed
		$('#upfront-popup-content').removeClass('discussion-settings-wrapper');
	},
	render: function () {
		this.$el.empty().append('<a href="#" class="settings">' + this.label + '</a>');
	},
	popup_open: function (e) {
		e.preventDefault();
		e.stopPropagation();
		var me = this,
			pop = Upfront.Popup.open(function (data, $top, $bottom) {
				me.out = this;
				me.popup_data = data;
				/*
				me.popup_data.$top = $top;
				me.popup_data.$bottom = $bottom;
				*/
				me.setup_tabs($top);
				me.setup_actions($bottom);
				me.setup_content();
			}, {}, "discussion-popup")
		;
		this.popup = this;
	},
	setup_tabs: function ($el) {},
	setup_actions: function ($el) {},
	setup_content: function () {},
	save_settings: function () {}
});

var DiscussionFallback_View = GlobalSettings_View.extend({
	label: l10n.discussion_settings,
	setup_content: function () {
		$(this.out)
			.empty()
			.append(
				'<p class="settings-disabled">' + l10n.settings_disabled + '</p>'
			)
		;
	}
});

var DiscussionSettings_View = GlobalSettings_View.extend({
	label: l10n.discussion_settings,
    initialize: function () {
    	GlobalSettings_View.prototype.initialize.call(this);
    	this.on("settings:tabs:switch_to:settings", this.render_settings_content, this);
    	this.on("settings:tabs:switch_to:avatars", this.render_avatars_content, this);
    	this.on("settings:save", this.save_settings, this);
    },
	setup_tabs: function ($el) {
		this.tabs = new DiscussionSettings_Tabs_View();
		this.tabs.parent_view = this;
		this.tabs.render();
		$el.append(this.tabs.$el);
	},
	setup_actions: function ($el) {
		var actions = new DiscussionSettings_Actions_View();
		actions.parent_view = this;
		actions.render();
		$el.empty().append(actions.$el);
	},
	setup_content: function () {
		this.render_settings_content();
		this.tabs.activate_tab('settings');
	},
	render_settings_content: function () {
		var settings = new DiscussionSettings_Settings_View({
			el: this.out,
			model: new DiscussionSettings_Model()
		});
		settings.render();
		this.active_view = settings;
	},
	render_avatars_content: function () {
		var avatars = new DiscussionSettings_Avatars_View({
			el: this.out,
			model: new DiscussionSettings_Model()
		});
		avatars.render();
		this.active_view = avatars;
	},
	save_settings: function () {
		var data = {
			action: 'upfront-discussion_settings-' + this.active_view.type + '-save',
			data: this.active_view.get_data()
		};
		Upfront.Util.post(data).done(function () {
			Upfront.Popup.close();
		});
	}
});
var DiscussionSettings_Tabs_View = Backbone.View.extend({
	tagName: "ul",
	className: "upfront-tabs upfront-ucomment-tabs",
	events: {
		"click li": "switch_to"
	},
	render: function () {
		this.$el
			.empty()
			.append('<li class="settings">' + l10n.discussion_settings + '</li>')
			.append('<li class="avatars">' + l10n.avatars + '</li>')
		;
	},
	switch_to: function (e) {
		e.preventDefault();
		e.stopPropagation();
		var $tgt = $(e.target),
			target = $tgt.is(".settings") ? "settings" : "avatars"
		;
		this.activate_tab(target);
		this.parent_view.trigger("settings:tabs:switch_to:" + target);
	},
	activate_tab: function (tab) {
		var $tab = this.$el.find('li.' + tab);
		this.$el.find("li").removeClass("active");
		$tab.addClass("active");
	}
});
var DiscussionSettings_Actions_View = Backbone.View.extend({
	className: "use_selection_container",
	events: {
		"click a": "trigger_settings_save"
	},
	render: function () {
		this.$el.empty().append('<a href="#">' + l10n.ok + '</a>');
	},
	trigger_settings_save: function (e) {
		e.preventDefault();
		e.stopPropagation();
		this.parent_view.trigger("settings:save");
	}
});

var DiscussionSettings_ActionView = Backbone.View.extend({
	templates: {
		section_label: '<h3>{{label}}</h3>'
	},
	initialize: function () {
		var me = this;
		this.model.load().done(function () {
			me.render_final();
		});
	},
	render_final: function () {
		var me = this;
		this.populate_sections();
		this.$el.empty();
		this.$el.addClass('discussion-settings-wrapper');

		this.sections.each(function (section) {
			if (section.label) me.$el.append(_.template(me.templates.section_label, {label: section.label}));
			section.fields.each(function (field) {
				field.render();
				me.$el.append(field.$el);
			});
		});
	},
	get_data: function () {
		var data = {};
		this.sections.each(function (section) {
			section.fields.each(function (field) {
				if (field.get_name) data[field.get_name()] = field.get_value();
				else data = _.extend(data, field.get_value());
			});
		});
		return data;
	},
	render: function () {
		this.$el.empty().append(l10n.please_wait);
	}
});

var DiscussionSettings_Avatars_View = DiscussionSettings_ActionView.extend({
	type: 'avatars',
	populate_sections: function () {
		this.sections = _([
			{
				label: l10n.avatar_settings,
				fields: _([
					new CheckboxField({
						model: this.model,
						property: 'show_avatars',
						values: [{label: l10n.show_avatars, value: '1'}]
					})
				])
			},
			{
				label: l10n.max_rating,
				fields: _([
					new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'avatar_rating',
						layout: "vertical",
						values: [
							{label: l10n.rating.g, value: 'G', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
							{label: l10n.rating.pg, value: 'PG', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
							{label: l10n.rating.r, value: 'R', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
							{label: l10n.rating.x, value: 'X', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'}
						]
					})
				])
			},
			{
				label: l10n.default_avatar,
				fields: _([
					new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'avatar_default',
						layout: "vertical",
						values: this.model.get("avatars")
					})
				])
			}
		]);
	}
});
var DiscussionSettings_Settings_View = DiscussionSettings_ActionView.extend({
	type: "settings",
	spawn_checkbox: function (label, prop, value) {
		value = value || "1";
		return new Upfront.Views.Editor.Field.Checkboxes({
			multiple: false,
			model: this.model,
			property: prop,
			values: [
				{label: label, value: value}
			]
		});
	},
	populate_sections: function () {
		this.sections = _([
			{
				label: l10n.article.label,
				fields: _([
					this.spawn_checkbox(l10n.article.pingback, 'default_pingback_flag'),
					this.spawn_checkbox(l10n.article.ping_status, 'default_ping_status', 'open'),
					this.spawn_checkbox(l10n.article.comment_status, 'default_comment_status', 'open'),
					this.spawn_checkbox(l10n.article.attachments, 'allow_attachments'),
					this.spawn_checkbox(l10n.article.email, 'show_email_subscription_field')
				])
			},
			{
				label: l10n.other.label,
				fields: _([
					this.spawn_checkbox(l10n.other.require_name_email, 'require_name_email'),
					this.spawn_checkbox(l10n.other.comment_registration, 'comment_registration'),
					new BooleanSubfieldField({
						model: this.model,
						property: '',
						field: new Upfront.Views.Editor.Field.Checkboxes({
							model: this.model,
							property: "close_comments_for_old_posts",
							values: [
								{label: l10n.other.autoclose, value: "1"}
							]
						}),
						subfield: new CounterField({
							model: this.model,
							property: "close_comments_days_old"
						})
					}),
					new BooleanSubfieldField({
						model: this.model,
						property: '',
						field: new Upfront.Views.Editor.Field.Checkboxes({
							model: this.model,
							property: "thread_comments",
							values: [
								{label: l10n.other.thread_comments, value: "1"}
							]
						}),
						subfield: new CounterField({
							model: this.model,
							property: "thread_comments_depth"
						})
					}),
					new PagedCommentsField({
						model: this.model,
						field: new Upfront.Views.Editor.Field.Checkboxes({
							model: this.model,
							property: "page_comments",
							values: [
								{label: l10n.other.page_comments, value: "1"}
							]
						}),
						depth: new CounterField({
							model: this.model,
							property: "default_comments_page"
						}),
						page: new Upfront.Views.Editor.Field.Select({
							model: this.model,
							property: "default_comments_page",
							values: [
								{label: l10n.other.last, value: 'newest'},
								{label: l10n.other.first, value: 'oldest'}
							]
						})
					}),
					new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: "comment_order",
						label: l10n.other.order,
						values: [
							{label: l10n.other.older, value: 'asc'},
							{label: l10n.other.newer, value: 'desc'}
						]
					})

				])
			},
			{
				label: l10n.other.email_me,
				fields: _([
					this.spawn_checkbox(l10n.other.comments_notify, 'comments_notify'),
					this.spawn_checkbox(l10n.other.moderation_notify, 'moderation_notify')
				])
			},
			{
				label: l10n.other.before_comment_appears,
				fields: _([
					this.spawn_checkbox(l10n.other.comment_moderation, 'comment_moderation'),
					this.spawn_checkbox(l10n.other.comment_whitelist, 'comment_whitelist')
				])
			},
			{
				label: l10n.other.moderation_label,
				fields: _([
					new LabeledCounterField({
						model: this.model,
						property: "comment_max_links",
						label: l10n.other.max_links
					}),
					new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: 'moderation_keys',
						label: l10n.other.moderation_keys
					}),
					new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: 'blacklist_keys',
						label: l10n.other.blacklist_keys
					})
				])
			}
		]);
	}
});

var BooleanSubfieldField = Backbone.View.extend({
	className: "upfront-field-complex_field",
	initialize: function(opts){
		this.options = opts;
	},
	render: function () {
		this.$el.empty();
		this.$el.append(this.get_field_html());
		this.$el.on("click", '[name="' + this.options.subfield.get_name() + '"]', this.stop_prop);
	},
	stop_prop: function (e) { e.stopPropagation(); e.preventDefault(); },
	get_field_html: function () {
		this.options.subfield.render();
		this.options.field.render();
		return _.template(this.options.field.$el.html(), {subfield: this.options.subfield.$el.html()});
	},
	get_value: function () {
		var data = {},
			$field = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
			$subfield = this.$el.find('[name="' + this.options.subfield.get_name() + '"]')
		;
		data[this.options.field.get_name()] = $field.is(":checkbox") ? ($field.is(":checked") ? 1 : 0) : $field.val();
		data[this.options.subfield.get_name()] = $subfield.val();
		return data;
	}
});
var CheckboxField = Upfront.Views.Editor.Field.Checkboxes.extend({
	multiple: false
});
var CounterField = Upfront.Views.Editor.Field.Text.extend({
	get_label_html: function () {},
	get_field_html: function () {
			var attr = {
				'type': 'number',
				'class': 'upfront-field upfront-field-counter',
				'min': 0,
				'step': 1,
				'id': this.get_field_id(),
				'name': this.get_field_name(),
				'value': this.get_saved_value()
			};
			return '<input ' + this.get_field_attr_html(attr) + ' />';
		}
});
var LabeledCounterField = CounterField.extend({
	className: "upfront-field-labeled_counter_field",
	get_field_html: function () {},
	get_label_html: function () {
		var field = CounterField.prototype.get_field_html.call(this);
		return _.template(Upfront.Views.Editor.Field.Text.prototype.get_label_html.call(this), {field: field});
	}
});
var PagedCommentsField = BooleanSubfieldField.extend({
	render: function () {
		this.$el.empty();
		this.$el.append(this.get_field_html());
		this.$el.on("click", '[name="' + this.options.depth.get_name() + '"]', this.stop_prop);
		this.$el.on("click", '[name="' + this.options.page.get_name() + '"]', this.stop_prop);
	},
	stop_prop: function (e) { e.stopPropagation(); e.preventDefault(); },
	get_field_html: function () {
		this.options.depth.render();
		this.options.page.render();
		this.options.field.render();
		return _.template(this.options.field.$el.html(), {
			depth: this.options.depth.$el.html(),
			page: this.options.page.$el.html()
		});
	},
	get_value: function () {
		var data = {},
			$field = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
			$depth = this.$el.find('[name="' + this.options.depth.get_name() + '"]'),
			$page = this.$el.find('[name="' + this.options.page.get_name() + '"]')
		;
		data[this.options.field.get_name()] = $field.is(":checkbox") ? ($field.is(":checked") ? 1 : 0) : $field.val();
		data[this.options.depth.get_name()] = $depth.val();
		data[this.options.page.get_name()] = $page.val();
		return data;
	}
});

var Settings = ElementSettings.extend({
	panels: {
		Appearance: {
			mainDataCollection: 'ucommentPresets',
			styleElementPrefix: 'ucomment-preset',
			ajaxActionSlug: 'ucomment',
			panelTitle: l10n.settings,
			presetDefaults: Upfront.mainData.presetDefaults.ucomment,
			styleTpl: styleTpl
		}
	},
	title: l10n.settings
});

var UcommentElement = Upfront.Views.Editor.Sidebar.Element.extend({

	draggable: false,

	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-comment');
		this.$el.html(l10n.element_name);
	},

	add_element: function () {
		var object = new UcommentModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c11 upfront-comment_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(375)}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});


function add_comment () {
	if (
		_upfront_post_data.post_id
		||
		(Upfront.Application.get_current() === Upfront.Application.MODE.THEME && 'type' in _upfront_post_data.layout && 'single' === _upfront_post_data.layout.type)
	) {
		Upfront.Application.LayoutEditor.add_object("Ucomment", {
			"Model": UcommentModel,
			"View": UcommentView,
			"Element": UcommentElement,
			"Settings": Settings
		});
	}
	// Generate presets styles to page
	Util.generatePresetsToPage('ucomment', styleTpl);
}
Upfront.Events.on("application:mode:after_switch", function () {
	if (Upfront.Application.get_current() !== Upfront.Application.MODE.THEME) return false;
	add_comment();
});
add_comment();

Upfront.Models.UcommentModel = UcommentModel;
Upfront.Views.UcommentView = UcommentView;

});
})(jQuery);
