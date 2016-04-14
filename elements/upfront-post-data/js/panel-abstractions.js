define([
	'scripts/upfront/settings/modules/base-module',
	'scripts/upfront/settings/field-factory',
	'scripts/upfront/preset-settings/state-settings',

	'scripts/redactor/ueditor-inserts',
	/**
	 * @todo Refactor this to a different, shared location
	 */
	'elements/upfront-posts/js/post-list-meta-views',
], function (BaseModule, FieldFactory, StateSettings, Inserts, Meta) {

	var l10n = Upfront.Settings.l10n.post_data_element;

	var OptionsModule = BaseModule.extend({
		className: function () {
			var cls = (typeof this.initialize === typeof BaseModule.prototype.className
				? BaseModule.prototype.className()
				: (BaseModule.prototype.className || '')
			).split(' ');
			cls.push('upfront-post_data-part');
			cls.push('part-module-panel');
			return cls.join(' ');
		},
		map_panel_fields: function () {
			var me = this,
				fields = this.get_fields(),
				object_model = new Upfront.Models.ObjectModel()
			;

			fields.push({
				type: "Button",
				label: l10n.custom_markup,
				className: 'edit_preset_label',
				compact: true
			});

			fields.push({
				type: "Button",
				label: l10n.edit_template,
				className: 'edit_post_markup edit_preset_css',
				compact: true,
				on_click: function () {
					me.spawn_editor();
				}
			});

			_(this.model.attributes).each(function (value, key) {
				if ("id" === key || "name" === key) return true;
				object_model.set_property(key, value);
			});

			return _.map(fields, function (field) {
				var options = _.extend(field, {change: function (value) {
					me.update_object(value, field.property);
				}});
				return FieldFactory.createField(field.type, _.extend({ model: object_model }, _.omit(field, ['type'])));
			});
		},
		get_fields: function () { return []; },
		get_object_model: function () {
			return this.model;
		},
		update_object: function (value, property) {
			if (_.isUndefined(value) ) value = '';
			this.model.set(property, value);
			this.trigger("part:property:change", property, value);
		},
		render: function () {
			this.fields = _(this.map_panel_fields());
			this.options.title = this.title;
			BaseModule.prototype.render.apply(this, arguments);

			var modules = this.get_modules();

			this.state = new StateSettings({
				model: this.model,
				state: 'static',
				modules: modules
			});
			this.state.render();

			this.$el.append(this.state.$el);
			
			//Move Edit Preset to bottom
			this.$el.find('.state_modules').append(this.$el.find('.edit_preset_css'));
			this.$el.addClass("preset_specific");
		},
		get_modules: function () {
			var me = this,
				name = function (name) { return 'static-' + me.data_part + '-' + name; }
			;
			return [{
				moduleType: 'Typography',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-typography'),
						typeface: name('font-family'),
						weight: name('weight'),
						fontstyle: name('fontstyle'),
						style: name('style'),
						size: name('font-size'),
						line_height: name('line-height'),
						color: name('font-color'),
					}
				}
			}];
		},
		spawn_editor: function () {
			var me = this,
				tpl_name = 'post-part-' + this.data_part,
				template = this.model.get(tpl_name),
				embed_object = ('meta' === this.options.part ? Meta.Embed : Inserts.inserts.embed),
				editor = new embed_object({data: {code: template}, model: this.model}),
				manager = false,
				resize_cbk = function () {
					if (manager) {
						var width = jQuery('#sidebar-ui').width() - 1;
						manager.$el
							.width(jQuery(window).width() -  width)
							.css('left', width);
					}
				}
			;

			jQuery(window).on('resize', resize_cbk);
			
			editor
				.start()
				.done(function (view, code) {
					jQuery(window).off('resize', resize_cbk);
					me.model.set(tpl_name, code);
				})
			;

			// Temporarily hack size
			this.listenTo(editor, 'manager:rendered', function (mgr, main) {
				manager = mgr;
				resize_cbk();
			})
		},
		// These two just satisfy the interface
		get_name: function () { return false; },
		get_value: function () { return false; },
	});

	var ToggleableOptions = OptionsModule.extend({
		events: function () {
			return _.extend({}, OptionsModule.prototype.events, {
				'click .upfront-settings-item-title .toggle': 'toggle_box',
			});
		},
		render: function () {
			var me = this,
				value = { label: this.title, value: '1' },
				hidden_parts = this.model.get("hidden_parts") || [],
				is_hidden = true,
				check = false
			;

			if (hidden_parts.indexOf(me.data_part) < 0) {
				value["checked"] = "checked";
				is_hidden = false;
			}

			check = new Upfront.Views.Editor.Field.Checkboxes({
				default_value: 1,
				values: [value],
				change: function (value) {
					var hidden_parts = me.model.get("hidden_parts") || [],
						pos = hidden_parts.indexOf(me.data_part)
					;

					// Set up parts
					if (value && value.length && pos >= 0) {
						hidden_parts.splice(pos, 1);
					} else if (pos < 0) {
						hidden_parts.push(me.data_part);
					}
					me.model.set("hidden_parts", hidden_parts);
					
					// Set up appearances
					if (value && value.length) {
						me.$el.find(".upfront-settings-item-title").removeClass("inactive");
						me.show_content();
					} else {
						me.$el.find(".upfront-settings-item-title").addClass("inactive");
						me.hide_content();
					}

					// Do other stuff
					me.trigger("part:hide:toggle", me.data_part, (value && value.length && pos >= 0));
				}
			});
			check.render();
			check.delegateEvents();

			OptionsModule.prototype.render.apply(this, arguments);

			this.$el.find(".upfront-settings-item-title")
				.empty()
				.append(check.$el)
				.append('<a href="#toggle" class="toggle">&times;</a>')
			;

			// Hide the stuff that's meant to be hidden
			if (is_hidden) {
				this.hide_content();
			}

			// temporary style hack
			this.$el.find(".upfront-settings-item-title .toggle").css('background-image', 'url(' + Upfront.Settings.root_url.replace(/\/$/, '') + '/img/uf-ui-sprite.svg)')
		},
		toggle_box: function (e) {
			if (e && e.preventDefault) e.preventDefault();
			if (e && e.stopPropagation) e.stopPropagation();

			var $content = this.$el.find('.upfront-settings-item-content:first, .state_modules');
			if ($content.is(":visible")) this.hide_content();
			else this.show_content();

			return false;
		},
		hide_content: function () {
			var $content = this.$el.find('.upfront-settings-item-content:first, .state_modules');
			return $content.hide();
		},
		show_content: function () {
			var $content = this.$el.find('.upfront-settings-item-content:first, .state_modules');
			return $content.show();
		}
	});

	return {
		Options: OptionsModule,
		Toggleable: ToggleableOptions
	};
});