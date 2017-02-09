(function ($) {
define([
	'text!elements/upfront-gallery/js/templates/label-editor-template.html',
	'text!elements/upfront-gallery/js/templates/label-selector-template.html',
	'text!elements/upfront-gallery/js/templates/labels-template.html'
], function(labelEditorTpl, labelSelectorTpl, labelsTpl) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var LabelEditor = Backbone.View.extend({
		template: _.template(labelEditorTpl),
		labelSelectorTpl: _.template(labelSelectorTpl),

		events: {
			"click :text": "stop_prop",
			"keyup .labels_filter :text.filter": "fillLabelSuggestionList",
			"click .new_labels .toggle-add-label": "show_add_label",
			"click .new_labels .submit-label": "add_new_labels",
			"focus :text.filter": "add_focus_state",
			"blur :text.filter": "remove_focus_state",
			"keyup .new_labels :text.add-label": "enter_new_labels"
		},

		initialize: function(options) {
			this.options = options || {};
			this.gallery = options.gallery;
			this.labels = options.labels;
			this.imageId = options.imageId;
		},
		
		stop_prop: function (e) {
			e.stopPropagation();
		},
		
		add_focus_state: function (e) {
			this.$el.addClass('focus');
		},
		
		remove_focus_state: function (e) {
			this.$el.removeClass('focus');
		},
		
		update_selection: function (e) {
			e.preventDefault();
			e.stopPropagation();
			var $text = this.$el.find(".labels_filter :text.filter"),
				selection = $text.val()
			;
			this.selection = selection;

			this.render_labels();
		},
		
		show_add_label: function (e) {
			e.preventDefault();
			e.stopPropagation();
			var $hub = this.$el.find(".new_labels");
			$hub.addClass('active');
		},
		
		enter_new_labels: function (e) {
			if (e.which == 13) {
				this.add_new_labels();
			}
		},
		
		add_new_labels: function (e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			var $text = this.$el.find(".new_labels :text.add-label"),
				selection = $text.val()
			;
			this.model.add_new_label(selection);
		},

		/*?
		 * Prevent crazy click hijack that navigates and reloads the page.
		 */
		onNameFieldClick: function(event) {
			$(event.target).focus();
			event.preventDefault();
			event.stopPropagation();
			return false;
		},

		updateLabels: function() {
			this.$el.find('.ugallery-magnific-wrapper').html(_.template(labelsTpl, {labels: this.labels, l10n: l10n.template}));
			if (this.labels.length) {
				this.$el.parents('.inline-panel-control-dialog')
					.siblings('.upfront-icon-region-edit-labels-no-labels')
					.removeClass('upfront-icon-region-edit-labels-no-labels')
					.addClass('upfront-icon-region-edit-labels');
			} else {
				this.$el.parents('.inline-panel-control-dialog')
					.siblings('.upfront-icon-region-edit-labels')
					.removeClass('.upfront-icon-region-edit-labels')
					.addClass('upfront-icon-region-edit-labels-no-labels');
			}
 		},

		render: function() {
			this.$el.html(this.template({
				labels: _.template(labelsTpl, {labels: this.labels, l10n: l10n.template}),
				imageId: this.imageId,
				l10n: l10n.template,
				selection: this.selection
			}));
			
			//this.render_existing_labels();
			this.render_labels();

			return this;
		},
		
		render_existing_labels: function () {
			var me = this,
				$hub = this.$el.find("div.labels_filter ul")
			;
			$hub.empty();
			
			_.each(this.model.get_shared_labels(), function (label) {
				var item = new MediaManager_ItemControl_LabelItem({model: label});
				item.media_items = me.model;
				item.render();
				$hub.append(item.$el);
			});
		},
		render_labels: function () {
			var me = this,
				$hub = this.$el.find(".labels_list ul"),
				known_labels = ActiveFilters.get("label"),
				shared_labels = this.model.get_shared_labels(),
				has_selection = false,
				match = 0
			;
			$hub.empty();
			if (!this.selection) return false;
			
			known_labels.each(function (label) {
				var item = new MediaManager_ItemControl_LabelItem({model: label});
				item.shared = shared_labels;
				item.media_items = me.model;
				item.selection = me.selection;
				item.render();
				if (item.matched) {
					$hub.append(item.$el);
					match++;
				}
			});
			if (match > 0) this.$el.addClass('has_match');
			else this.$el.removeClass('has_match');
		},

		focusNameField: function() {
			var $addlabels = this.$el.find('.ugallery-addlabels');
			if ( $addlabels.val() === '' )
				$addlabels.focus();
			else
				this.addLabel($addlabels);
		},

		fillLabelSuggestionList: function(e) {
			var me = this;

			if([9, 13, 38, 40, 27].indexOf(e.which) !== -1) {
				return;
			}

			var val = $(e.target).val(),
				allLabels = _.keys(Upfront.data.ugallery.label_names),
				labels = [];

			if(val.length < 2) {
				return $('.labels_list').html('');
			}

			_.each(allLabels, function(label){
				if(label.indexOf(val) !== -1){
					var lab = Upfront.data.ugallery.label_names[label];

					if(!_.findWhere(me.labels, { id: lab.id + '' }) && !_.findWhere(me.labels, { id: parseInt(lab.id, 10)})){
						console.log(lab.text);
						labels.push({
							id: lab.id,
							text: lab.text.replace(val, '<span class="selection">' + val + '</span>')
						});
					}
				}
			});

			this.$el.find('.labels_list').html(me.labelSelectorTpl({labels: labels, l10n: l10n.template}));
		},

		selectNextSuggestion: function() {
			var selected,
				suggestions,
				currentIdx = -1,
				idx = 0;

			suggestions = this.$el.find('.labels_list li');

			if(!suggestions.length){
				return;
			}

			selected = suggestions.find('label.selected');

			if(selected.length){
				selected.removeClass('selected');
			}

			while(idx < suggestions.length && currentIdx === -1){
				currentIdx = suggestions[idx] === selected.parent()[0] ? idx : -1;
				idx++;
			}

			if(currentIdx === -1) {
				$(suggestions[0]).find('label').addClass('selected');
			} else if(currentIdx < suggestions.length - 1) {
				$(suggestions[currentIdx + 1]).find('label').addClass('selected');
			}
		},

		selectPreviousSuggestion: function() {
			var selected,
				suggestions,
				currentIdx = -1,
				idx = 0;

			suggestions = this.$el.find('.labels_list li');

			selected = suggestions.find('label.selected');

			if(selected.length){
				selected.removeClass('selected');
			}

			while(idx < suggestions.length && currentIdx === -1){
				currentIdx = suggestions[idx] === selected.parent()[0] ? idx : -1;
				idx++;
			}

			if(currentIdx === -1) {
				$(suggestions[suggestions.length -1]).find('label').addClass('selected');
			} else if(currentIdx > 0) {
				$(suggestions[currentIdx - 1]).find('label').addClass('selected');
			}
		},

		onNameFieldKeydown: function(e) {
			if (_.indexOf([13, 9, 40, 38, 27], e.which) !== -1) {
				e.preventDefault();
			}

			switch (e.which) {
				case 13: // Enter
					this.addLabel($(e.target));
					break;
				case 9: // Tab
				case 40: // Down
					this.selectNextSuggestion();
					break;
				case 38: // Up
					this.selectPreviousSuggestion();
					break;
				case 27: // Escape
					this.clearSuggestions();
			}
		},

		clearSuggestions: function() {
			this.$el.find('.labels_list').html('');
		},

		addLabel: function($nameField) {
			var selected = this.$el.find('.labels_list label.selected'),
				me = this,
				label,
				labelId;

			if(!selected.length){
				label = $.trim($nameField.val());
				if(label.length){
					$nameField.val('').siblings('.labels_list').html('');
					$.when(this.gallery.addLabel(label, this.imageId)).done(function(label) {
						me.labels.push(label);
						me.updateLabels();
						$nameField.val('').siblings('.labels_list').html('');
					});
				}

				return;
			}

			labelId = selected.attr('rel');
			label = Upfront.data.ugallery.label_ids[labelId];

			this.labels.push(label);
			this.updateLabels();

			$nameField.val('').siblings('.labels_list').html('');
			this.gallery.addLabel(label.text, this.imageId);
		},

		onLabelClick: function(e){
			var me = this,
				$label = $(e.target).hasClass('selection') ? $(e.target).parent() : $(e.target);

			// Prevent click hijack that reloads the page
			e.preventDefault();
			e.stopPropagation();

			var labelId = $label.attr('rel');
			if (labelId) {
				var label = Upfront.data.ugallery.label_ids[labelId];
				this.gallery.addLabel(label.text, this.imageId);
				$.when(this.gallery.addLabel(label.text, this.imageId)).done(function(label) {
					me.labels.push(label);
					me.updateLabels();
					me.$el.find('.labels_list').html('');
					me.$el.find('.ugallery-addlabels').val('');
				});
			}
		},

		removeLabel: function(e){
			e.preventDefault();

			var $label = $(e.target),
				me = this,
				labelId = $label.data('idx'),
				data,
				label;

			data = {
				action: 'upfront-media-disassociate_label',
				'term': labelId,
				'post_id': this.imageId
			};

			Upfront.Util.post(data);
			label = _.findWhere(this.labels, { id: labelId + ''}) || _.findWhere(this.labels, { id: parseInt(labelId, 10)});
			this.labels = _.without(this.labels, label);

			this.gallery.deleteLabel(labelId, this.imageId);

			$label.fadeOut('fast', function(){
				$(this).remove();
				if (me.labels.length === 0) {
					me.updateLabels();
				}
			});
		}
	});
	
	var Label_ItemControl_LabelItem = Backbone.View.extend({
		tagName: 'li',
		events: {
			click: "toggle_label_assignment"
		},
		render: function () {
			var me = this,
				is_used = this.media_items.is_used_label(this.model),
				used = _.template('<input type="checkbox" id="{{id}}" class="upfront-field-checkbox" value="{{value}}" checked />'),
				free = _.template('<input type="checkbox" id="{{id}}" class="upfront-field-checkbox" value="{{value}}" />'),
				label = _.template('<label for="{{id}}">{{name}}</label>'),
				name = this.model.get("filter") || '',
				match_rx = this.selection ? new RegExp('(' + this.selection + ')', 'i') : false,
				obj = this.model.toJSON()
			;
			this.matched = false;
			this.$el.empty();
			if (match_rx && !name.match(match_rx)) return false;
			this.matched = true;
			obj.id = this.cid;
			obj.name = name.replace(match_rx, '<span class="selection">$1</span>');
			this.$el
				.append(label(obj))
				.append((is_used ? used : free)(obj))
			;
		},
		toggle_label_assignment: function (e) {
			e.preventDefault();
			e.stopPropagation();
			this.media_items.update_label_state(this.model);
		}
	});

	return LabelEditor;
});
})(jQuery);
