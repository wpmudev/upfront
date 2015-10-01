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
				label: "Custom Markup",
				className: 'edit_preset_label',
				compact: true
			});
			fields.push({
				type: "Button",
				label: "Edit Markup",
				className: 'edit_preset_css',
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

			this.$el.append(this.state.$el)
		},
		get_modules: function () {
			var me = this,
				name = function (name) { return 'static-' + me.data_part + '-' + name; }
			;
			return [{
				moduleType: 'Typography',
				options: {
					toggle: true,
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
		render: function () {
			var me = this,
				value = { label: this.title, value: '1' },
				hidden_parts = this.model.get("hidden_parts") || [],
				check = false
			;

			if (hidden_parts.indexOf(me.data_part) <= 0) {
				value["checked"] = "checked"
			}

			check = new Upfront.Views.Editor.Field.Checkboxes({
				default_value: 1,
				values: [value],
				change: function (value) {
					var hidden_parts = me.model.get("hidden_parts") || [],
						pos = hidden_parts.indexOf(me.data_part)
					;

					if (value && value.length && pos >= 0) {
						hidden_parts.splice(pos, 1);
					} else if (pos < 0) {
						hidden_parts.push(me.data_part);
					}
					console.log(hidden_parts);
					me.model.set("hidden_parts", hidden_parts);

					me.trigger("part:hide:toggle", me.data_part);
				}
			});
			check.render();
			check.delegateEvents();

			OptionsModule.prototype.render.apply(this, arguments);

			this.$el.find(".upfront-settings-item-title")
				.empty()
				.append(check.$el)
			;
		}
	});

	return {
		Options: OptionsModule,
		Toggleable: ToggleableOptions
	};
});