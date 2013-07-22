(function ($, undefined) {

// ----- Models -----

	var MediaCollection_Model = Backbone.Collection.extend({
		/*
		comparator: function (item) {
			return item.get("post_title");
		}
		*/
	});
	var MediaCollection_Selection = Backbone.Collection.extend({
		model: MediaItem_Model,
		initialize: function () {
			Upfront.Events.on("media_manager:media:labels_loaded", this.global_labels_loaded, this);
		},
		get_shared_labels: function () {
			var known_labels = ActiveFilters.get("label"),
				selected_labels = [],
				shared_labels = [],
				tmp_shared = {}
			;
			this.each(function (item) {
				tmp_shared[item.get("ID")] = item.get("labels") || [];
			});
			selected_labels = _.intersection.apply(this, _(tmp_shared).values());
			known_labels.each(function (label) {
				if (selected_labels.indexOf(label.get("value")) >= 0) shared_labels.push(label);
			});
			return shared_labels;
		},
		is_used_label: function (label) {
			return (_(this.get_shared_labels()).invoke("get", "value").indexOf(label.get("value")) >= 0);
		},
		update_label_state: function (label) {
			return this.is_used_label(label)
				? this.disassociate_label(label)
				: this.associate_label(label)
			;
		},
		associate_label: function (label) {
			this._update_label('', label);
		},
		disassociate_label: function (label) {
			Upfront.Util.log("disassocisting labels");
			this._update_label('dis', label);
		},
		_update_label: function (pfx, label) {
			pfx = pfx || '';
			var me = this,
				idx = label.get("value"),
				data = {
					action: "upfront-media-" + pfx + "associate_label",
					term: idx,
					post_ids: this.invoke("get", "ID")
				}
			;
			Upfront.Util.post(data)
				.success(function (response) {
					me.each(function (model) {
						var labels = response.data[model.get("ID")];
						if (labels) model.set({labels: labels}, {silent: true});
					});
					me.trigger("change");
				})
			;
		},
		add_new_label: function (label) {
			var me = this,
				data = {
					"action": "upfront-media-add_label",
					"term": label,
					"post_ids": this.invoke("get", "ID")
				}
			;
			Upfront.Util.post(data)
				.success(function (response) {
					me.each(function (model) {
						var labels = response.data[model.get("ID")];
						if (labels) model.set({labels: labels}, {silent: true});
					});
					Upfront.Events.trigger("media_manager:media:labels_updated");
					me.trigger("change");
				})
			;
		},
		delete_media_items: function () {
			var me = this,
				data = {
					"action": "upfront-media-remove_item",
					"post_ids": this.invoke("get", "ID")
				}
			;
			Upfront.Util.post(data)
				.success(function (response) {
					me.reset([]);
					Upfront.Events.trigger("media_manager:media:list", ActiveFilters);
				})
			;
		},
		global_labels_loaded: function () {
			this.trigger("change");
		}
	});
	var MediaItem_Model = Backbone.Model.extend({
		defaults: {
			thumbnail: "<img src='http://cdn5.iconfinder.com/data/icons/app-tab-bar-icons-for-iphone/60/Flickr_social_circle_square_social_media_icontexto_gray_button.png' />"
		}
	});

	var MediaFilter_Collection = Backbone.Collection.extend({
		model: Media_FilterItem
	});
	var MediaFilter_Item = Backbone.Model.extend({
	});

	var ActiveMediaFilter_Collection = Backbone.Model.extend({
		labels_cache: false,
		initialize: function () {
			this.to_defaults();
			Upfront.Events.on("media_manager:media:filters_updated", this.update_active_filters, this);
			Upfront.Events.on("media_manager:media:labels_updated", this.reload_labels, this);
		},
		to_defaults: function () {
			this.set("type", new MediaFilter_Collection([
				new MediaFilter_Item({filter: "Images", value: 'images', state: true}),
				new MediaFilter_Item({filter: "Videos", value: 'videos', state: false}),
				new MediaFilter_Item({filter: "Audios", value: 'audios', state: false})
			]), {silent: true});

			this.set("recent", new MediaFilter_Collection([
				new MediaFilter_Item({filter: "5", value: 5, state: false}),
				new MediaFilter_Item({filter: "10", value: 10, state: false}),
				new MediaFilter_Item({filter: "20", value: 20, state: false}),
				new MediaFilter_Item({filter: "40", value: 40, state: false}),
				new MediaFilter_Item({filter: "100", value: 100, state: false})
			]), {silent: true});

			this.set("order", new MediaFilter_Collection([
				new MediaFilter_Item({filter: "Newest", value: 'date_desc', state: true}),
				new MediaFilter_Item({filter: "Oldest", value: 'date_asc', state: false}),
				new MediaFilter_Item({filter: "A>Z", value: 'title_asc', state: false}),
				new MediaFilter_Item({filter: "Z>A", value: 'title_desc', state: false})
			]), {silent: true});

			this.set({"search": new MediaFilter_Collection([])}, {silent: true});

			this.set_labels_to_defaults();
		},
		set_labels_to_defaults: function () {
			if (this.labels_cache) {
				var arr = [];
				_(this.labels_cache).each(function (item) {
					arr.push(new MediaFilter_Item({filter: item.name, value: item.term_id, state: false}));
				});
				this.set("label", new MediaFilter_Collection(arr), {silent: true});
				Upfront.Events.trigger("media_manager:media:labels_loaded");
			} else this.reload_labels();
		},
		reload_labels: function () {
			var me = this;
			Upfront.Util.post({action: "upfront-media-get_labels"})
				.success(function (response) {
					var arr = [];
					if (response.data) {
						me.labels_cache = response.data;
						me.set_labels_to_defaults();
					}
				})
			;
		},
		update_active_filters: function (filter, data) {
			if (!filter || !this.get(filter)) {
				this.to_defaults();
				Upfront.Events.trigger("media_manager:media:filters_reset");
			} else {
				var collection = data && data.get ? data.get(filter).toArray() : data,
					me = this.get(filter)
				;
				_(collection).each(function (item) {
					if (item.get("state")) {
						var has = me.where({filter: item.get("filter")});
						if (has.length) {
							has[0].set({state: item.get("state")}, {silent: true});
						}
					}
				});
			}
			Upfront.Events.trigger("media_manager:media:list", this);
		},
		to_request_json: function () {
			var data = {},
				me = this
			;
			_(this.attributes).each(function (collection, idx) {
				var active = me.get(idx).where({state:true});
				data[idx] = _(active).invoke("get", "value");
			});
			return data;
		},
		to_list: function () {
			var data = {},
				me = this
			;
			_(this.attributes).each(function (collection, idx) {
				var active = me.get(idx).where({state:true});
				data[idx] = _(active).invoke("get", "filter");
			});
			return data;
		}
	});

	var ActiveFilters = new ActiveMediaFilter_Collection();

// ----- Views -----


	var MediaManager_Controls_View = Backbone.View.extend({
		className: "upfront-media-controls",
		is_search_active: false,
		initialize: function () {
			Upfront.Events.on("media:item:selection_changed", this.switch_controls, this);
			Upfront.Events.on("media:search:requested", this.switch_to_search, this);
		},
		render: function () {
			this.render_filters();
		},
		render_filters: function () {
			var control = this.is_search_active ? new MediaManager_SearchFiltersControl() : new MediaManager_FiltersControl();
			control.render();
			this.$el.empty().append(control.$el);
		},
		render_media: function (selected) {
			var item_control = new MediaManager_ItemControl({model: new MediaCollection_Selection(selected)});
			item_control.render();
			this.$el.empty();
			if (this.is_search_active) {
				var control = new MediaManager_SearchFiltersControl();
				control.render();
				this.$el.append(control.$el);
			}
			this.$el.append(item_control.$el);
		},
		switch_controls: function (media_collection) {
			var positive = media_collection.where({selected: true});
			if (positive.length) this.render_media(positive);
			else this.render_filters();
		},
		switch_to_search: function (search) {
			this.is_search_active = search && search.get("state");
			this.render_filters();
		}
	});

	var MediaManager_AuxControls_View = Backbone.View.extend({
		className: "upfront-media-aux_controls",
		initialize: function () {
			Upfront.Events.on("media:item:selection_changed", this.switch_controls, this);
		},
		render: function () {
			this.render_selection();
		},
		render_selection: function () {
			var selection_control = new MediaManager_SelectionControl({model: this.model});
			selection_control.render();
			this.$el.empty().append(selection_control.$el);
		},
		render_delete: function (selected) {
			var delete_control = new MediaManager_DeleteControl({model: new MediaCollection_Selection(selected)});
			delete_control.render();
			this.render_selection();
			this.$el.append(delete_control.$el);
		},
		switch_controls: function (media_collection) {
			var positive = media_collection.where({selected: true});
			if (positive.length) this.render_delete(positive);
			else this.render_selection();
		}
	});

		var MediaManager_SelectionControl = Backbone.View.extend({
			className: "select_control_container",
			events: {
				"click a.none": "select_none",
				"click a.all": "select_all"
			},
			render: function () {
				this.$el.empty().append('Select <a href="#all" class="all">All</a>&nbsp;|&nbsp;<a href="#none" class="none">None</a>');
			},
			select_none: function (e) {
				e.preventDefault();
				e.stopPropagation();
				this.model.each(function (item) {
					item.set({selected: false}, {silent: true});
				});
				this.model.trigger("change");
				Upfront.Events.trigger("media:item:selection_changed", this.model);
			},
			select_all: function (e) {
				e.preventDefault();
				e.stopPropagation();
				var all = [];
				this.model.each(function (item) {
					item.set({selected: true}, {silent: true});
					all.push(item);
				});
				this.model.trigger("change");
				Upfront.Events.trigger("media:item:selection_changed", this.model);
			}
		});
		var MediaManager_DeleteControl = Backbone.View.extend({
			className: "delete_control_container",
			events: {
				click: "delete_selection"
			},
			render: function () {
				this.$el.empty().append('<a href="#delete">Delete</a>');
			},
			delete_selection: function (e) {
				e.preventDefault();
				e.stopPropagation();
				var show_nag = false;
				this.model.each(function (item) {
					if (item.get("parent")) show_nag = true;
				});
				if (!show_nag || (show_nag && confirm("The selected media file is already in use. Are you sure?"))) {
					this.model.delete_media_items();
				}
			}
		});

		var MediaManager_ItemControl = Backbone.View.extend({
			templates: {
				title: _.template('<input type="text" value="{{post_title}}" />'),
				caption: _.template('<label>{{title}}</label>'),
				shared_label: _.template('<a href="#remove" data-idx="{{value}}">{{filter}}</a>&nbsp;')
			},
			events: {
				"change .change_title :text": "change_title",
				"click .existing_labels a": "drop_label"
			},
			initialize: function () {
				this.model.on("change", this.render, this);
			},
			render: function () {
				this.$el.empty()
					.append('<div class="change_title" />')
					.append('<div class="add_labels" />')
					.append('<div class="existing_labels" />')
				;
				this.render_title();
				this.render_labels_adding();
				this.render_shared_labels();
			},
			render_title: function () {
				var $hub = this.$el.find(".change_title");
				$hub.empty();
				if (this.model.length > 1) {
					$hub.append(this.model.length + ' files selected');
				} else {
					$hub
						.append(this.templates.caption({title: "Media Title"}))
						.append(this.templates.title(this.model.at(0).toJSON()))
					;
				}
			},
			render_labels_adding: function () {
				var me = this,
					$hub = this.$el.find(".add_labels"),
					container = new MediaManager_ItemControl_LabelsContainer({model: this.model})
				;
				$hub.empty().append(this.templates.caption({title: "Add Label(s)"}));
				container.render();
				$hub.append(container.$el);
			},
			render_shared_labels: function () {
				var me = this,
					$hub = this.$el.find(".existing_labels"),
					shared_labels = this.model.get_shared_labels(),
					title = (this.model.length > 1 ? 'Shared Label(s)' : 'Current Label(s)')
				;
				$hub.empty()
					.append(this.templates.caption({title: title}))
					.append('<br />')
				;
				_(shared_labels).each(function (label) {
					$hub.append(me.templates.shared_label(label.toJSON()));
				});
			},
			change_title: function (e) {
				var model = this.model.at(0),
					$title = this.$el.find(".change_title :text")
				;
				model.set({post_title: $title.val()});
				var me = this,
					data = {
						action: "upfront-media-update_media_item",
						data: model.toJSON()
					}
				;
				Upfront.Util.post(data)
					.done(function () {
						model.trigger("change");
					})
				;
			},
			drop_label: function (e) {
				e.preventDefault();
				e.stopPropagation();
				var $label = $(e.target),
					idx = $label.attr("data-idx"),
					shared = this.model.get_shared_labels(),
					label_idx = _(shared).invoke("get", "value").indexOf(idx),
					label = label_idx >= 0 && shared[label_idx] ? shared[label_idx] : false
				;
				if (label) this.model.update_label_state(label);
			}
		});

			var MediaManager_ItemControl_LabelsContainer = Backbone.View.extend({
				className: "upfront-additive_multiselection",
				selection: '',
				events: {
					"keyup .search_labels :text": "update_selection",
					"click .add_labels a": "add_new_labels"
				},
				render: function () {
					this.$el.empty()
						.append('<div class="search_labels" />')
						.append('<div class="labels_list" />')
						.append('<div class="add_labels" />')
					;
					this.render_search();
					this.render_labels();
					this.render_addition();
				},
				render_search: function () {
					var $hub = this.$el.find(".search_labels");
					$hub.empty().append('<input type="text" value="' + this.selection + '"/>');
				},
				render_labels: function () {
					var me = this,
						$hub = this.$el.find(".labels_list"),
						known_labels = ActiveFilters.get("label"),
						shared_labels = this.model.get_shared_labels()
					;
					$hub.empty();
					known_labels.each(function (label) {
						var item = new MediaManager_ItemControl_LabelItem({model: label});
						item.shared = shared_labels;
						item.media_items = me.model;
						item.selection = me.selection;
						item.render();
						$hub.append(item.$el);
					});

				},
				render_addition: function () {
					var $hub = this.$el.find(".add_labels");
					$hub.empty();
					if (this.selection) $hub.append('<b>' + this.selection + '</b> <a href="#add">+Add</a>');
				},
				update_selection: function (e) {
					var $text = this.$el.find(".search_labels :text"),
						selection = $text.val()
					;
					this.selection = selection;

					this.render_labels();
					this.render_addition();
				},
				add_new_labels: function (e) {
					e.preventDefault();
					var $text = this.$el.find(".search_labels :text"),
						selection = $text.val()
					;
					this.model.add_new_label(selection);
				}
			});

				var MediaManager_ItemControl_LabelItem = Backbone.View.extend({
					events: {
						click: "toggle_label_assignment"
					},
					render: function () {
						var me = this,
							is_used = this.media_items.is_used_label(this.model),
							used = _.template('<input type="checkbox" value="{{value}}" checked />'),
							free = _.template('<input type="checkbox" value="{{value}}" />'),
							name = this.model.get("filter"),
							match_rx = this.selection ? new RegExp('^(' + this.selection + ')', 'i') : false
						;
						this.$el.empty();
						if (!name.match(match_rx)) return false;
						this.$el
							.append(name.replace(match_rx, '<span class="selection">$1</span>'))
							.append('&nbsp;')
							.append((is_used ? used : free)(this.model.toJSON()))
						;
					},
					toggle_label_assignment: function (e) {
						e.preventDefault();
						this.media_items.update_label_state(this.model);
					}
				});

		var MediaManager_SearchFiltersControl = Backbone.View.extend({
			events: {
				"click a": "clear_search"
			},
			render: function () {
				var search = ActiveFilters.get("search").first();
				this.$el.empty().append(
					_.template('Showing X results for <b>{{value}}</b> <a href="#clear">Clear search</a>', search.toJSON())
				);
			},
			clear_search: function (e) {
				e.preventDefault();
				var search = new MediaFilter_Item({filter: false, value: false, state: false});
				ActiveFilters.set({search: new MediaFilter_Collection([search])});
				Upfront.Events.trigger("media_manager:media:list", ActiveFilters);
				Upfront.Events.trigger("media:search:requested", search);
			}
		});

		var MediaManager_FiltersControl = Backbone.View.extend({
			events: {
				"change #media_manager-show_titles": "toggle_titles"
			},
			initialize: function () {
				this.filter_selection = new MediaManager_FiltersSelectionControl();
				this.filters_selected = new MediaManager_FiltersSelectedControl({model: ActiveFilters});
			},
			render: function () {
				this.filter_selection.render();
				this.filters_selected.render();
				this.$el.empty()
					.append(this.filter_selection.$el)
					.append(this.filters_selected.$el)
					.append(
						"<input type='checkbox' checked id='media_manager-show_titles' />" +
						'&nbsp;' +
						'<label for="media_manager-show_titles">Show titles</label>'
					)
				;
			},
			toggle_titles: function (e) {
				Upfront.Events.trigger("media_manager:media:toggle_titles");
			}
		});

		var MediaManager_FiltersSelectedControl = Backbone.View.extend({
			events: {
				"click a.filter": "drop_filter",
				"click a.all_filters": "drop_all"
			},
			initialize: function () {
				Upfront.Events.on("media_manager:media:list", this.set_filters, this);
			},
			render: function () {
				this.$el.empty();
				var me = this,
					tpl = _.template(' <a href="#" class="filter" data-type="{{type}}" data-filter="{{filter}}">{{filter}}</a>')
				;
				_(this.model.to_list()).each(function (filters, type) {
					_(filters).each(function (filter) {
						me.$el.append(tpl({filter: filter, type: type}));
					});
				});
				this.$el.append(" <a href='#' class='all_filters'>Clear</a>");
			},
			set_filters: function (filters) {
				this.model = filters;
				this.render();
			},
			drop_filter: function (e) {
				e.preventDefault();
				var $el = $(e.target),
					all = this.model,
					type = $el.attr("data-type"),
					filter = $el.attr("data-filter")
				;
				if (type && all.get(type)) {
					var has = all.get(type).where({filter: filter});
					if (has && has.length) _(has).invoke("set", {state: false}, {silent: true});
				} else {
					_(this.model.attributes).each(function (collection, idx) {
						var has = all.get(idx).where({filter: filter});
						if (has.length) {
							type = idx;
							_(has).invoke("set", {state: false}, {silent: true});
						}
					});
				}
				Upfront.Events.trigger("media_manager:media:filters_updated", type, this.model);
			},
			drop_all: function (e) {
				e.preventDefault();
				Upfront.Events.trigger("media_manager:media:filters_updated", false, false);
			}
		});

		var MediaManager_FiltersSelectionControl = Backbone.View.extend({
			className: "upfront-filter_selection-control clearfix",
			events: {
				"click li a": "select_control"
			},
			initialize: function () {
				this.controls = _([
					new Control_MediaType(),
					new Control_MediaDate(),
					new Control_MediaFileName(),
					new Control_MediaRecent(),
					new Control_MediaLabels()
				]);
			},
			render: function () {
				var me = this,
					$target = this.$el.empty().append("<ul />").find("ul:first"),
					tpl = _.template("<li><a href='#' data-idx='{{idx}}'>{{name}}</a></li>")
				;
				this.controls.each(function (ctl, idx) {
					$target.append(tpl({idx:idx, name:ctl.get_name()}));
				});
				this.$el.append('<div class="upfront-filter_control" />');
				this.$control = this.$el.find("div.upfront-filter_control");
				Upfront.Events.on("media_manager:media:filters_updated");
			},
			select_control: function (e) {
				var $el = $(e.target),
					idx = $el.attr("data-idx"),
					control = this.controls.toArray()[idx]
				;

				control.render();
				this.$control.empty().append(control.$el);
				return false;
			}
		});

		var Media_FilterSelection_Multiselection = Backbone.View.extend({
			tagName: "ul",
			get_name: function () {
				return this.filter_name;
			},
			initialize_model: function () {
				this.model = ActiveFilters.get(this.filter_type);
				this.model.on("change", this.apply_changes, this);
			},
			render: function () {
				var me = this;
				this.$el.empty();
				this.model.each(function (model) {
					if (me.allowed_values && me.allowed_values.indexOf(model.get("value")) < 0) return false;
					var item = new Media_FilterSelection_Multiselection_Item({model: model});
					item.render();
					me.$el.append(item.$el);
				});
			},
			apply_changes: function () {
				var data = {},
					values = []
				;
				data = this.model.where({state:true});
				Upfront.Events.trigger("media_manager:media:filters_updated", this.filter_type, data);
			},
			update_selection: function () {
				var active = ActiveFilters.get(this.filter_type);
				if (!active) {
					this.model.invoke("set", {state: false});
				} else {
					this.model.each(function (model) {
						var has = active.where({filter: model.get("filter"), state: true});
						model.set({state: !!has.length});
					});
				}
				this.render();
				return false;
			}
		});

		var Media_FilterSelection_AdditiveMultiselection = Media_FilterSelection_Multiselection.extend({
			className: "upfront-additive_multiselection",
			events: {
				"keyup :text.filter": "show_matching_labels"
			},
			render: function () {
				var me = this,
					sel = this.selection || ''
				;
				this.$el
					.empty()
					.append('<input type="text" class="filter" value="' + sel + '" />')
					.append('<div class="labels_hub" />')
				;
				this.render_items();
			},
			render_items: function () {
				var me = this,
					$hub = this.$el.find("div.labels_hub")
				;
				$hub.empty();
				this.model.each(function (model) {
					if (me.allowed_values && me.allowed_values.indexOf(model.get("value")) < 0) return false;
					var item = new Media_FilterSelection_AdditiveMultiselection_Item({model: model});
					item.selection = me.selection;
					item.render();
					$hub.append(item.$el);
				});
			},
			show_matching_labels: function (e) {
				var $text = this.$el.find(":text.filter"),
					selection = $text.val()
				;
				this.selection = selection;
				this.render_items();
			}
		});

		var Media_FilterSelection_Uniqueselection = Media_FilterSelection_Multiselection.extend({
			render: function () {
				var me = this;
				this.$el.empty();
				this.model.each(function (model) {
					if (me.allowed_values && me.allowed_values.indexOf(model.get("value")) < 0) return false;
					var item = new Media_FilterSelection_Uniqueselection_Item({model: model});
					item.render();
					me.$el.append(item.$el);
					item.on("model:unique_state:change", me.change_state, me);
				});
			},
			change_state: function (model) {
				this.model.each(function (item) {
					if (item.get("value") != model.get("value")) item.set({state: false}, {silent: true});
				});
				model.set({state: true}, {silent: true});
				this.apply_changes();
				this.render();
			}
		});

			var Media_FilterSelection_Multiselection_Item = Backbone.View.extend({
				tagName: "li",
				events: {
					"click": "on_click"
				},
				initialize: function () {
					this.model.on("change", this.render, this);
				},
				render: function () {
					var name = this.model.get("filter");
					if (this.model.get("state")) name = '<b>' + name + '</b>';
					this.$el.empty().append(name);
				},
				on_click: function () {
					this.model.set({state: !this.model.get("state")});
				}
			});

			var Media_FilterSelection_Uniqueselection_Item = Media_FilterSelection_Multiselection_Item.extend({
				on_click: function () {
					this.model.set({state: !this.model.get("state")}, {silent: true});
					this.trigger("model:unique_state:change", this.model);
				}
			});

			var Media_FilterSelection_AdditiveMultiselection_Item = Media_FilterSelection_Multiselection_Item.extend({
				render: function () {
					var checked = _.template('<input type="checkbox" name="{{filter}}" value="{{value}}" checked />'),
						unchecked = _.template('<input type="checkbox" name="{{filter}}" value="{{value}}" />'),
						name = this.model.get("filter"),
						match_rx = this.selection ? new RegExp('^(' + this.selection + ')', 'i') : false
					;
					this.$el.empty();
					if (match_rx && !name.match(match_rx)) return false;
					this.$el
						.append(name.replace(match_rx, '<span class="selection">$1</span>'))
						.append('&nbsp;')
						.append((this.model.get("state") ? checked : unchecked)(this.model.toJSON()))
					;
				}
			});

		var Media_FilterCollection = Backbone.View.extend({
			render: function () {
				var me = this;
				this.$el.empty();
				this.model.each(function (model) {
					var item = new Media_FilterItem({model: model});
					item.render();
					me.$el.append(item.$el);
				});
			}
		});

			var Media_FilterItem = Backbone.View.extend({
				render: function () {
					this.$el.empty().append(this.model.get("filter"));
				}
			});

		var Control_MediaType = Media_FilterSelection_Multiselection.extend({
			initialize: function () {
				this.filter_name = "Media type";
				this.filter_type = "type";
				this.initialize_model();
				Upfront.Events.on("media_manager:media:filters_updated", this.update_selection, this);
				Upfront.Events.on("media_manager:media:filters_reset", this.initialize_model, this);
			}
		});

		var Control_MediaDate = Media_FilterSelection_Uniqueselection.extend({
			allowed_values: ['date_asc', 'date_desc'],
			initialize: function () {
				this.filter_name = "Date";
				this.filter_type = "order";
				this.initialize_model();
				Upfront.Events.on("media_manager:media:filters_updated", this.update_selection, this);
				Upfront.Events.on("media_manager:media:filters_reset", this.initialize_model, this);
			}
		});

		var Control_MediaFileName = Media_FilterSelection_Uniqueselection.extend({
			allowed_values: ['title_desc', 'title_asc'],
			initialize: function () {
				this.filter_name = "File Name";
				this.filter_type = "order";
				this.initialize_model();
				Upfront.Events.on("media_manager:media:filters_updated", this.update_selection, this);
				Upfront.Events.on("media_manager:media:filters_reset", this.initialize_model, this);
			}
		});

		var Control_MediaRecent = Media_FilterSelection_Uniqueselection.extend({
			initialize: function () {
				this.filter_name = "Recent";
				this.filter_type = "recent";
				this.initialize_model();
				Upfront.Events.on("media_manager:media:filters_updated", this.update_selection, this);
				Upfront.Events.on("media_manager:media:filters_reset", this.initialize_model, this);
			}
		});

		var Control_MediaLabels = Media_FilterSelection_AdditiveMultiselection.extend({
			initialize: function () {
				this.filter_name = "Labels";
				this.filter_type = "label";
				this.initialize_model();
				Upfront.Events.on("media_manager:media:filters_updated", this.update_selection, this);
				Upfront.Events.on("media_manager:media:filters_reset", this.initialize_model, this);
				Upfront.Events.on("media_manager:media:labels_loaded", this.reinitialize_model, this);
			},
			reinitialize_model: function () {
				this.initialize_model();
				this.render();
			}
		});


	/**
	 * Top-level tabs switching and control.
	 */
	var MediaManager_Switcher = Backbone.View.extend({
		events: {
			"click .library": "switch_to_library",
			"click .embed": "switch_to_embed"
		},
		template: _.template(
			'<ul class="upfront-tabs"> <li class="library">Library</li> <li class="embed">Embed</li> </ul>'
		),
		render: function () {
			this.$el.empty().append(
				this.template({})
			);
			this.$el.addClass('clearfix');
			this.switch_to_library();
		},
		switch_to_library: function (e) {
			this.$el
				.find("li").removeClass("active")
				.filter(".library").addClass("active")
			;
			if (e) {
				e.preventDefault();
				this.trigger("media_manager:switcher:to_library");
			}
		},
		switch_to_embed: function (e) {
			e.preventDefault();
			this.$el
				.find("li").removeClass("active")
				.filter(".embed").addClass("active")
			;
			this.trigger("media_manager:switcher:to_embed");
		}
	});

	/**
	 * Main media dispatcher, has main level views.
	 */
	var MediaManager_View = Backbone.View.extend({
		initialize: function (data) {
			data = data || {};
			var type = data.type || "PostImage";
			this.popup_data = data.data;

			this.switcher_view = new MediaManager_Switcher({el: this.popup_data.$top});
			this.command_view = new MediaManager_BottomCommand({el: this.popup_data.$bottom});
			this.library_view = new MediaManager_PostImage_View(data.collection);
			this.embed_view = new MediaManager_EmbedMedia({});

			Upfront.Events.on("media_manager:media:list", this.switch_media_type, this);
		},
		render: function () {
			this.switcher_view.render();

			this.switcher_view.on("media_manager:switcher:to_library", this.render_library, this);
			this.switcher_view.on("media_manager:switcher:to_embed", this.render_embed, this);

			this.command_view.render();
			this.command_view.on("media_manager:switcher:to_upload", this.render_upload, this);

			this.render_library();
		},
		render_library: function () {
			this.load();
			this.embed_view.model.clear({silent:true});
			this.library_view.render();
			this.library_view.$el.css({
				'max-height': this.popup_data.height,
				'overflow-y': 'scroll'
			});
			this.$el.empty().append(this.library_view.$el);
		},
		render_embed: function () {
			this.embed_view.model.clear({silent:true});
			this.embed_view.render();
			this.embed_view.$el.css({
				'max-height': this.popup_data.height,
				'overflow-y': 'scroll'
			});
			this.$el.empty().append(this.embed_view.$el);
		},
		render_upload: function () {
			if (!this.library_view.$el.is(":visible")) this.render_library();
			var me = this,
				new_media = new MediaItem_Model({progress: 0})
			;

			this.$el.append('<input id="fileupload" type="file" style="display:none" name="media" data-url="' + _upfront_media_upload + '">');
			$("#fileupload").fileupload({
				dataType: 'json',
				add: function (e, data) {
					var media = data.files[0],
						name = media.name || 'tmp'
					;
					new_media.set({post_title: name});
					me.library_view.media_collection.add(new_media);
					data.submit();
					new_media.on("upload:abort", function () {
						data.abort();
						if (new_media.get("ID")) {
							// Already uploaded this file, remove on the server side
							Upfront.Util.post({
								action: "upfront-media-remove_item",
								item_id: new_media.get("ID")
							}).always(function () {
								me.library_view.media_collection.trigger("change");
							});
						}
						me.library_view.media_collection.remove(new_media);
						me.library_view.media_collection.trigger("change");
					});
					new_media.trigger("upload:start", media);
				},
				progressall: function (e, data) {
					var progress = parseInt(data.loaded / data.total * 100, 10);
					new_media.trigger("upload:progress", progress);
				},
				done: function (e, data) {
					new_media.set({ID: data.result.data}, {silent:true});
					Upfront.Util.post({
						action: "upfront-media-get_item",
						item_id: data.result.data
					}).done(function (response) {
						new_media.set(response.data, {silent:true});
						new_media.trigger("upload:finish");
					}).fail(function () {
						Upfront.Events.trigger("media_manager:media:list", ActiveFilters);
					});
				},
				fail: function (data) {
					alert('error uploading file');
					Upfront.Events.trigger("media_manager:media:list", ActiveFilters);
				}
			}).trigger("click");
		},
		load: function (data) {
			data = data && data.type ? data : ActiveFilters.to_request_json();
			data["action"] = "upfront-media-list_media";
			var me = this;
			Upfront.Util.post(data)
				.done(function (response) {
					me.library_view.update(response.data);
				})
				.fail(function (response) {
					me.library_view.update([]);
				})
			;
		},
		switch_media_type: function (what) {
			this.load(what.to_request_json());
		}
	});

	/**
	 * Bottom commands view (search etc)
	 */
	var MediaManager_BottomCommand = Backbone.View.extend({
		render: function () {
			var upload = new MediaManager_BottomCommand_Upload(),
				search = new MediaManager_BottomCommand_Search(),
				use = new MediaManager_BottomCommand_UseSelection()
			;
			upload.render();
			upload.on("media_manager:switcher:to_upload", this.switch_to_upload, this);
			search.render();
			use.render();
			this.$el.empty()
				.append(upload.$el)
				.append(use.$el)
				.append(search.$el)
			;
		},
		switch_to_upload: function (e) {
			this.trigger("media_manager:switcher:to_upload");
		}
	});

		var MediaManager_BottomCommand_Upload = Backbone.View.extend({
			className: "upload_media_container",
			events: {
				"click .upload": "switch_to_upload"
			},
			render: function () {
				this.$el.empty().append('<button type="button" class="upload">Upload new media</button>');
			},
			switch_to_upload: function (e) {
				e.preventDefault();
				this.trigger("media_manager:switcher:to_upload");
			}
		});

		var MediaManager_BottomCommand_Search = Backbone.View.extend({
			className: "search_container clearfix",
			events: {
				"click .search": "do_search",
				"click .clear": "clear_search"
			},
			render: function () {
				var active = ActiveFilters.get("search"),
					search = !!active.length ? active.first() : false,
					has_search = !!search && search.get("state")
				;
				this.$el.empty()
					.append('<input type="text" placeholder="Search" value="' + (has_search && search ? search.get("value") : '') + '" />')
				;
				if (has_search) {
					this.$el.append('<a href="#clear" class="clear">x</a>');
				}
				this.$el.append('<div class="search" id="upfront-search_action"><i class="icon-search"></i></div>');
			},
			do_search: function (e) {
				e.preventDefault();
				var $text = this.$el.find(":text"),
					text = $text.val(),
					search = new MediaFilter_Item({filter: text, value: text, state: true})
				;
				if (!text) {
					search = new MediaFilter_Item({filter: false, value: false, state: false});
				}

				ActiveFilters.to_defaults();
				ActiveFilters.set("search", new MediaFilter_Collection([search]));
				Upfront.Events.trigger("media_manager:media:list", ActiveFilters);
				Upfront.Events.trigger("media:search:requested", search);
				this.render();
			},
			clear_search: function (e) {
				var $text = this.$el.find(":text");
				$text.val('');
				this.do_search(e);
			}
		});

		var MediaManager_BottomCommand_UseSelection = Backbone.View.extend({
			className: "use_selection_container",
			events: {
				"click a": "use_selection"
			},
			initialize: function () {
				Upfront.Events.on("media:item:selection_changed", this.update_model, this);
			},
			render: function () {
				this.$el.empty().append('<a href="#use" class="use">OK</a>');
			},
			update_model: function (selected) {
				var positive = selected.where({selected: true});
				this.model = new MediaCollection_Selection(positive);
			},
			use_selection: function (e) {
				e.preventDefault();
				/*
				if (this.model && this.model.length) {
					Upfront.Util.dbg(this.model);
				} else {
					Upfront.Util.log('nothing to use, closing');
				}
				*/
				Upfront.Popup.close(this.model);
			}
		});

	/**
	 * Embed media from URL
	 */
	var MediaManager_EmbedMedia = Backbone.View.extend({
		className: "upfront-embed_media clearifx",
		initialize: function () {
			this.model = new MediaItem_Model();

			this.embed_pane = new MediaManager_Embed_DetailsPane({model: this.model});
			this.embed_pane.on("embed:editable:updated", this.embed_updated, this);

			this.preview_pane = new MediaManager_Embed_PreviewPane({model: this.model});
		},
		render: function () {
			this.embed_pane.render();
			this.preview_pane.render();
			this.$el.empty()
				.append(this.embed_pane.$el)
				.append(this.preview_pane.$el)
			;
		},
		embed_updated: function () {
			this.preview_pane.render();
			var me = this;
			Upfront.Util.post({
				action: "upfront-media-embed",
				media: this.model.get("original_url")
			}).done(function (response) {
				me.model.set(response.data, {silent:true});
				me.preview_pane.trigger("embed:media:imported");
				me.embed_pane.render();
			});
		}
	});
		var MediaManager_Embed_DetailsPane = Backbone.View.extend({
			className: "upfront-pane",
			events: {
				"click button": "save"
			},
			initialize: function () {
				this.editables = _([
					new MediaItem_EmbedableUrl({model: this.model}),
					new MediaItem_EditableTitle({model: this.model}),
					new MediaItem_EditableLabels({model: this.model})
				]);
			},
			render: function () {
				this.$el.empty();
				var me = this;
				this.editables.each(function (editable) {
					editable.render();
					editable.on("embed:updated", me.editable_updated, me);
					me.$el.append(editable.$el);
				});
				this.$el.append('<button type="button">OK</button>');
			},
			editable_updated: function () {
				this.trigger("embed:editable:updated");
			},
			save: function () {
				this.editables.invoke("update");
				var me = this,
					data = {
						action: "upfront-media-update_media_item",
						data: this.model.toJSON()
					}
				;
				Upfront.Util.post(data)
					.done(function () {
						Upfront.Util.log('successfully saved data');
						me.model.trigger("change");
					})
				;
			}
		});

		var MediaManager_Embed_PreviewPane = Backbone.View.extend({
			className: "upfront-pane",
			initialize: function () {
				this.preview_view = new MediaManager_Embed_Preview({model: this.model});
				this.labels_view = new MediaItem_Labels({model: this.model});
				this.on("embed:media:imported", this.update_media_preview, this);
			},
			render: function () {
				this.preview_view.render();
				//this.labels_view.render();
				this.$el.empty()
					.append(this.preview_view.$el)
					//.append(this.labels_view.$el)
				;
			},
			update_media_preview: function () {
				this.preview_view.render();
				this.labels_view.render();
				this.labels_view.delegateEvents();
				var progress = this.preview_view.is_image() ? 100 : 33;
				this.preview_view.set_progress(progress);
			}
		});

			var MediaManager_Embed_Preview = Backbone.View.extend({
				className: "upfront-media_manager-embed-preview",
				template: _.template('{{thumbnail}} <div class="progress"><div class="bar" /></div>'),
				render: function () {
					if (!this.model.get("original_url")) return this.$el.empty();
					var me = this,
						is_image = this.is_image(),
						thumbnail = is_image ? this.model.get("thumbnail") : this.get_media_thumbnail()
					;
					this.$el.empty().append(this.template({thumbnail: thumbnail}));
				},
				is_image: function () {
					return (this.model.get("original_url") || "").match(/\.(jpe?g|gif|png)$/i);
				},
				get_media_thumbnail: function () {
					return this.model.get("thumbnail");
				},
				set_progress: function (progress) {
					var $bar = this.$el.find(".progress .bar");
					$bar.css("width", progress + '%');
				}
			});

	/**
	 * Post images library implementation.
	 */
	var MediaManager_PostImage_View = MediaManager_View.extend({
		className: "upfront-media_manager upfront-media_manager-post_image clearfix",
		initialize: function (collection) {
			var data = data || {};
			collection = new MediaCollection_Model(collection);
			this.media_collection = collection;
		},
		render: function () {
			var media = new MediaCollection_View({model: this.media_collection}),
				aux = new MediaManager_AuxControls_View({model: this.media_collection}),
				controls = new MediaManager_Controls_View({model: this.media_collection})
			;
			controls.render();
			aux.render();
			media.render();
			this.$el
				.empty()
				.append(controls.$el)
				.append(aux.$el)
				.append(media.$el)
			;
			this.media_view = media;
		},
		update: function (collection) {
			this.media_view.model.reset(collection);
			this.media_view.render();
		}
	});

	var MediaCollection_View = Backbone.View.extend({
		tagName: 'ul',
		className: 'upfront-media_collection',
		initialize: function () {
			this.model.on("add", this.render, this);
			this.model.on("change", this.render, this);
			this.model.on("change:selected", this.propagate_selection, this);
		},
		render: function () {
			var me = this;
			this.$el.empty();
			if (!this.model.length) {
				this.$el.append('<p>Nothing here, move on</p>');
			} else {
				this.model.each(function (model) {
					var view = new MediaItem_View({model: model});
					view.render();
					me.$el.append(view.$el);
				});
			}
		},
		propagate_selection: function () {
			Upfront.Events.trigger("media:item:selection_changed", this.model);
		}
	});
		var MediaItem_View = Backbone.View.extend({
			tagName: 'li',
			className: 'upfront-media_item',
			events: {
				click: "toggle_item_selection"
			},
			initialize: function () {
				this.template = _.template("{{thumbnail}} <span class='title'>{{post_title}}</span> <div class='upfront-media_item-editor-container' />");
				Upfront.Events.on("media_manager:media:toggle_titles", this.toggle_title, this);

				this.model.on("upload:start", this.upload_start, this);
				this.model.on("upload:progress", this.upload_progress, this);
				this.model.on("upload:finish", this.upload_finish, this);
			},
			render: function () {
				this.$el.empty().append(
					this.template(this.model.toJSON())
				);
				if (this.model.get("parent")) this.$el.addClass("has-parent");
				if (this.model.get("selected")) {
					this.$el.addClass("selected");
					this.$el.find("img").after('<i class="icon-ok"></i>');
				}
			},
			toggle_title: function () {
				var $el = this.$el.find(".title");
				if ($el.is(":visible")) $el.hide();
				else $el.show();
			},
			toggle_item_selection: function (e) {
				this.model.set({selected: !this.model.get("selected")});
			},
			upload_start: function (media) {
				$(".upfront-media_item-editor").remove();
				var editor = new MediaItem_EditorView({
					model: this.model,
					media: media
				});
				editor.render();
				this.$el.find(".upfront-media_item-editor-container").append(editor.$el);
			},
			upload_progress: function (progress) {
				Upfront.Util.log(_.template("{{post.post_title}} progress changed to {{progress}}", {post:this.model.toJSON(), progress:progress}));
			},
			upload_finish: function () {
				this.$el.find("img").replaceWith(this.model.get("thumbnail"));
			}
		});

// ----- Editor -----

	var MediaItem_EditorView = Backbone.View.extend({
		className: "upfront-media_item-editor",
		events: {
			"click button": "save"
		},
		initialize: function (data) {
			this.editables = _([
				new MediaItem_EditableTitle({model: this.model})
			]);
			if (data && data.media) this.media = data.media;
		},
		render: function () {
			this.$el.empty();
			var me = this;
			this.editables.each(function (editable) {
				editable.render();
				me.$el.append(editable.$el);
			});

			var labels = new MediaItem_Labels({model: this.model});
			labels.render();
			this.$el.append(labels.$el);

			this.$el.append('<button type="button">OK</button>');
			if (!this.media) return true;

			var type = this.media.type || 'application/octet-stream',
				is_image = type.match(/^image/i)
			;
			if (is_image) return true;

			var nag = new MediaItem_UploadNag({model: this.model, media:this.media});
			nag.render();
			this.$el.append(nag.$el);
		},
		save: function () {
			this.editables.invoke("update");
			var me = this,
				data = {
					action: "upfront-media-update_media_item",
					data: this.model.toJSON()
				}
			;
			Upfront.Util.post(data)
				.done(function () {
					Upfront.Util.log('successfully saved data');
					me.model.trigger("change");
				})
			;
		}
	});

	var MediaItem_Labels = Backbone.View.extend({
		className: "upfront-media_labels",
		events: {
			"click button": "create_label",
			"click a.own_label": "drop_label",
			"click a.all_label": "add_label"
		},
		initialize: function () {
			this.labels = ActiveFilters.get("label");
			Upfront.Events.on("media_manager:media:labels_loaded", this.reset_labels, this);
		},
		reset_labels: function () {
			this.labels = ActiveFilters.get("label");
			this.render();
		},
		render: function () {
			var own_labels_template = _.template('<a class="own_label" href="#" data-idx="{{value}}">{{filter}}</a> '),
				all_labels_template = _.template('<a class="all_label" href="#" data-idx="{{value}}">{{filter}}</a> '),
				me = this,
				model_labels = this.model.get("labels"),
				own_labels = [],
				all_labels = []
			;
			this.$el.empty();
			if (this.labels) this.labels.each(function (item) {
				if (model_labels && model_labels.length && model_labels.indexOf(item.get("value")) >= 0) own_labels.push(own_labels_template(item.toJSON()));
				else all_labels.push(all_labels_template(item.toJSON()));
			});
			me.$el.append("Applied labels: ");
			_(own_labels).each(function (item) {
				me.$el.append(item);
			});
			this.$el.append(
				'<input type="text" placeholder="label..." />' +
				'<button type="button">Add</button>'
			);
			me.$el.append("All labels: ");
			_(all_labels).each(function (item) {
				me.$el.append(item);
			});
		},
		create_label: function (e) {
			e.preventDefault();
			e.stopPropagation();

			var label = this.$el.find(":text").val(),
				data = {
					"action": "upfront-media-add_label",
					"term": label,
					"post_id": this.model.get("ID")
				}
			;
			Upfront.Util.post(data)
				.success(function (response) {
					Upfront.Events.trigger("media_manager:media:labels_updated");
				})
			;
		},
		add_label: function (e) {
			this._update_labels(e);
		},
		drop_label: function (e) {
			this._update_labels(e, 'dis');
		},
		_update_labels: function (e, pfx) {
			pfx = pfx || '';
			e.preventDefault();
			e.stopPropagation();
			var me = this,
				$label = $(e.target),
				idx = $label.attr("data-idx"),
				data = {
					action: "upfront-media-" + pfx + "associate_label",
					term: idx,
					post_id: this.model.get("ID")
				}
			;
			Upfront.Util.post(data)
				.success(function (response) {
					var id = me.model.get("ID"),
						data = response.data || {},
						labels = data[id] || data
					;
					me.model.set("labels", labels, {silent: true});
					me.render();
				})
			;
		}
	});

	var MediaItem_UploadNag = Backbone.View.extend({
		className: "upload_type-nag",
		events: {
			"click .keep": "keep_file",
			"click .remove": "remove_file"
		},
		render: function () {
			console.log('rendering');
			this.$el.empty()
				.append("We recommend using services like YouTube, Vimeo or Soundcloud to store rich media files. You can then embed it easily into your site. Find out more here.")
				.append('<a href="#" class="button keep">Keep file</a>')
				.append('<a href="#" class="button remove">Remove file</a>')
			;
		},
		keep_file: function (e) {
			e.preventDefault();
		},
		remove_file: function (e) {
			e.preventDefault();
			this.model.trigger("upload:abort");
		}
	});

		var MediaItem_EditorEditable = Backbone.View.extend({
			className: "upfront-media_item-editable",
			events:{
				change: "update"
			},
			template: _.template(
				"<label>{{label}}<input type='text' name='{{name}}' value='{{value}}' placeholder='{{placeholder}}' /></label>"
			),
			get_name: function () {},
			get_label: function () {},
			get_placeholder: function () {},
			get_value: function () {
				return this.$el.find('[name="' + this.get_name() + '"]:first').val();
			},
			render: function () {
				var name = this.get_name() || '',
					label = this.get_label() || '',
					placeholder = this.get_placeholder() || '',
					value = this.model.get(this.get_name()) || '',
					data = {
						name:  name,
						label: label,
						placeholder: placeholder,
						value: value
					}
				;
				this.$el.empty().append(
					this.template(data)
				);
			},
			update: function () {
				var obj = {};
				obj[this.get_name()] = this.get_value();
				this.model.set(obj, {silent: true});
			}
		});

		var MediaItem_EditorEmbedableEditable = MediaItem_EditorEditable.extend({
			update: function () {
				var obj = {};
				obj[this.get_name()] = this.get_value();
				this.model.set(obj, {silent: true});
				this.trigger("embed:updated");
			}
		});

		var MediaItem_EmbedableUrl = MediaItem_EditorEmbedableEditable.extend({
			get_name: function () { return "original_url"; },
			get_label: function () { return "URL of the media"; },
			get_placeholder: function () { return "http://sample.com/path-to-image/image.jpg"; }
		});

		var MediaItem_EditableTitle = MediaItem_EditorEditable.extend({
			get_name: function () { return "post_title"; },
			get_label: function () { return "Image Title"; },
			get_placeholder: function () { return "Your image title"; }
		});

		var MediaItem_EditableLabels = MediaItem_EditorEditable.extend({
			get_label: function () { return "Labels"; },
			render: function () {
				var collection = new MediaCollection_Selection([this.model]),
					view = new MediaManager_ItemControl_LabelsContainer({model: collection})
				;
				view.render();
				collection.on("change", view.render_labels, view);
				this.$el.empty()
					.append('<label>' + this.get_label() + '</label>')
					.append(view.$el)
				;
			}
		});

// ----- Interface -----

	var ContentEditorUploader = Backbone.View.extend({
		initialize: function () {
			Upfront.Events.on("upfront:editor:init", this.rebind_ckeditor_image, this);
		},
		open: function () {
			var me = this,
				pop = false,
				type = type || "images"
			;
			pop = Upfront.Popup.open(function (data, $top, $bottom) {
				me.out = this;
				me.popup_data = data;
				me.popup_data.$top = $top;
				me.popup_data.$bottom = $bottom;
				me.load(type);
			});
			return pop;
		},
		ck_open: function () {
			var pop = this.open();
			pop.always(this.on_close);
			return false;
		},
		load: function (data) {
			var media = new MediaManager_View({
					el: this.out,
					data: this.popup_data
				})
			;
			media.render();
			return false;
		},
		on_close: function (popup, result) {
			//console.log(result);
			console.log('closing');
		},
		rebind_ckeditor_image: function () {
			var me = this;
			_(CKEDITOR.instances).each(function (editor) {
				var img = editor.getCommand('image');
				if (img && img.on) img.on("exec", me.ck_open, me);
			});
		}
	});

Upfront.Media = {
	"Manager": new ContentEditorUploader()
};

})(jQuery);