(function ($) {

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
		return comment_data ? comment_data : 'Loading';
	},
	
	on_render: function () {
		if ( !$(document).data('upfront-comment-' + _upfront_post_data.post_id) )
			this._get_comment_markup();
		var discussion_settings = new DiscussionSettings_View({model: this.model});
		discussion_settings.render();
		this.$el.append(discussion_settings.$el);
	},
	
	_get_comment_markup: function () {
		var me = this;
		Upfront.Util.post({"action": "ucomment_get_comment_markup", "data": JSON.stringify({"post_id": _upfront_post_data.post_id})})
			.success(function (ret) {
				var html = ret.data.replace(/<script.*?>.*?<\/script>/gim, ''); // strip script
				$(document).data('upfront-comment-' + _upfront_post_data.post_id, html);
				me.render();
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading comment");
		});
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
			})
		;
		this.popup = this;
	},
	setup_tabs: function ($el) {},
	setup_actions: function ($el) {},
	setup_content: function () {},
	save_settings: function () {},
});
var DiscussionSettings_View = GlobalSettings_View.extend({
	label: "Discussion settings",
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
		$(this.out).css({
			height: this.popup_data.height,
			"overflow-y": "scroll"
		});
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
		}
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
			.append('<li class="settings">Discussion Settings</li>')
			.append('<li class="avatars">Avatars</li>')
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
		this.$el.empty().append('<a href="#">OK</a>');
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
		this.$el.empty().append("Please, wait");
	}
});

var DiscussionSettings_Avatars_View = DiscussionSettings_ActionView.extend({
	type: 'avatars',
	populate_sections: function () {
		this.sections = _([
			{
				label: "Avatar Settings",
				fields: _([
					new CheckboxField({
						model: this.model,
						property: 'show_avatars',
						values: [{label: "Show avatars", value: '1'}]
					}),
				])
			},
			{
				label: "Maximum rating",
				fields: _([
					new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'avatar_rating',
						layout: "vertical",
						values: [
							{label: "Suitable for all audiences", value: 'G', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
							{label: "Possibly offensive, usually for audiences 13 and above", value: 'PG', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
							{label: "Intended for adult audiences above 17", value: 'R', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
							{label: "Even more mature than R", value: 'X', icon: 'http://1.gravatar.com/avatar/31cb559695bfc798dbf0981a52c7a748?s=32&d=&r=G&forcedefault=1'},
						]
					}),
				])
			},
			{
				label: "Default Avatar",
				fields: _([
					new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: 'avatar_default',
						layout: "vertical",
						values: this.model.get("avatars")
					}),
				])
			}
		]);
	}
});
var DiscussionSettings_Settings_View = DiscussionSettings_ActionView.extend({
	type: "settings",
	spawn_checkbox: function (label, prop, value) {
		value = value || "1";
		return new CheckboxField({
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
				label: "Default Article Settings",
				fields: _([
					this.spawn_checkbox("Attempt to notify any blogs linked to from the article", 'default_pingback_flag'),
					this.spawn_checkbox("Allow link notifications from other blogs (pingbacks and trackbacks)", 'default_ping_status', 'open'),
					this.spawn_checkbox("Allow people to post comments on new articles<br />(These settings may be overridden for individual articles.)", 'default_comment_status', 'open'),
					this.spawn_checkbox("Allow attachments in comments", 'allow_attachments'),
					this.spawn_checkbox("Show email subscription field", 'show_email_subscription_field'),
				])
			},
			{
				label: "Other Comment Settings",
				fields: _([
					this.spawn_checkbox("Comment author must fill out name and e-mail", 'require_name_email'),
					this.spawn_checkbox("Users must be registered and logged in to comment", 'comment_registration'),
					new BooleanSubfieldField({
						model: this.model,
						property: '',
						field: new Upfront.Views.Editor.Field.Checkboxes({
							model: this.model,
							property: "close_comments_for_old_posts",
							values: [
								{label: "Automatically close comments on articles older than {{subfield}} days", value: "1"}
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
								{label: "Enable threaded (nested) comments {{subfield}} levels deep", value: "1"}
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
								{label: "Paginate comments after {{depth}} top level comments and display {{page}} page by default", value: "1"}
							]
						}),
						depth: new CounterField({
							model: this.model,
							property: "default_comments_page",
						}),
						page: new Upfront.Views.Editor.Field.Select({
							model: this.model,
							property: "default_comments_page",
							values: [
								{label: "last", value: 'newest'},
								{label: "first", value: 'oldest'}
							]
						}),
					}),
					new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: "comment_order",
						label: "Comments should be displayed with the these comments at the top of each page",
						values: [
							{label: "older", value: 'asc'},
							{label: "newer", value: 'desc'}
						]
					}),

				])
			},
			{
				label: "E-mail me whenever",
				fields: _([
					this.spawn_checkbox("Anyone posts a comment", 'comments_notify'),
					this.spawn_checkbox("A comment is held for moderation", 'moderation_notify')
				])
			},
			{
				label: "Before a comment appears",
				fields: _([
					this.spawn_checkbox("An administrator must always approve the comment", 'comment_moderation'),
					this.spawn_checkbox("Comment author must have a previously approved comment", 'comment_whitelist'),
				])
			},
			{
				label: "Comment Moderation",
				fields: _([
					new LabeledCounterField({
						model: this.model,
						property: "comment_max_links",
						label: "Hold a comment in the queue if it contains {{field}} or more links. (A common characteristic of comment spam is a large number of hyperlinks.)"
					}),
					new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: 'moderation_keys',
						label: "When a comment contains any of these words in its content, name, URL, e-mail, or IP, it will be held in the moderation queue. One word or IP per line. It will match inside words, so “press” will match “WordPress”."
					}),
					new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: 'blacklist_keys',
						label: "When a comment contains any of these words in its content, name, URL, e-mail, or IP, it will be marked as spam. One word or IP per line. It will match inside words, so “press” will match “WordPress”."
					})
				])
			}
		]);
	}
});

var BooleanSubfieldField = Backbone.View.extend({
	className: "upfront-field-complex_field",
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
		var data = {}
			$field = this.$el.find('[name="' + this.options.field.get_name() + '"]')
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

var UcommentElement = Upfront.Views.Editor.Sidebar.Element.extend({
	
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-comment');
		this.$el.html('Comment');
	},

	add_element: function () {
		var object = new UcommentModel(),
			module = new Upfront.Models.Module({ 
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c11 upfront-comment_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": 25}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});


if (_upfront_post_data.post_id) {
	Upfront.Application.LayoutEditor.add_object("Ucomment", {
		"Model": UcommentModel, 
		"View": UcommentView,
		"Element": UcommentElement
	});
}

Upfront.Models.UcommentModel = UcommentModel;
Upfront.Views.UcommentView = UcommentView;

})(jQuery);
