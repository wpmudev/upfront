;(function($){
	define([
			"scripts/redactor/ueditor-insert",
			'elements/upfront-image/js/video-selector'
	],
	function(Insert, VideoSelector) {
		var l10n = Upfront.Settings && Upfront.Settings.l10n ?
			Upfront.Settings.l10n.global.ueditor
			: Upfront.mainData.l10n.global.ueditor
		;

		var VideoInsert = Insert.UeditorInsert.extend({
			type: 'video',
			// Allows controls to remain open when view is re-rendered
			controlsOpen: false,
			defaults: {
				'mute': false,
				'controls': true,
				'loop': false,
				'autoplay': false
			},
			events:{
				'click .video-insert-controls': 'toggleVideoControls',
				'click .swap-video-insert-button': 'swapVideo',
				'click .video-insert-toggle-mute': 'toggleMute',
				'click .video-insert-toggle-controls': 'toggleControls',
				'click .video-insert-toggle-loop': 'toggleLoop',
				'click .video-insert-toggle-autoplay': 'toggleAutoplay',
			},

			getSimpleOutput: function () {
				var $embed = $(this.data.get('video_embed'));
				if (this.data.get('mute') === true) {
					$embed.attr('muted', true);
				} else {
					$embed.removeAttr('muted');
				}
				if (this.data.get('controls') === true) {
					$embed.attr('controls', 'controls');
				} else {
					$embed.removeAttr('controls');
				}
				if (this.data.get('autoplay') === true) {
					$embed.attr('autoplay', true);
				} else {
					$embed.removeAttr('autoplay');
				}
				if (this.data.get('loop') === true) {
					$embed.attr('loop', true);
				} else {
					$embed.removeAttr('loop');
				}

				var out = $('<div><div class="uinsert-video-insert">' + $('<div/>').append($embed).html() + '</div></div>');
				return  out.html();
			},

			getOutput: function(){
				return  this.getSimpleOutput();
			},

			start: function($el) {
				var me = this,
					deferred = new $.Deferred(),
					videoSelector = new VideoSelector()
				;

				Upfront.preventRedactorStopOnOutsideClick = true;
				this.$editor = $el.closest(".redactor-box");
				this.data.set(this.defaults, {silent: true});

				videoSelector.open({multiple_selection: false })
					.done(function(videoData){
						videoSelector.close();
						var newEmbedVideo = $(videoData.embed).find('video').attr('width', parseInt(me.$editor.width(), 10)).attr('height', 'auto').attr('controls', 'controls');
						me.data.set({
							'video_embed': newEmbedVideo,
							'id': videoData.id
						});
						deferred.resolve(me, videoData.embed);
						Upfront.preventRedactorStopOnOutsideClick = false;
					});

				return deferred;
			},

			toggleVideoControls: function(event) {
				if (false === $(event.target).hasClass('video-insert-controls')) return;
				this.controlsOpen = !this.controlsOpen;
				this.$el.find('.video-insert-controls-panel').toggle();
				if (this.$el.find('.video-insert-controls').hasClass('video-insert-controls-expanded')) {
					this.$el.find('.video-insert-controls').removeClass('video-insert-controls-expanded');
				} else {
					this.$el.find('.video-insert-controls').addClass('video-insert-controls-expanded');
				}
			},
			// Insert editor UI
			render: function(){
				var me = this;
				this.$el.addClass('uinsert-video-insert');
				var $embed = $(this.data.get('video_embed'));
				if (this.data.get('mute') === true) {
					$embed.attr('muted', true);
				} else {
					$embed.removeAttr('muted');
				}
				if (this.data.get('controls') === true) {
					$embed.attr('controls', 'controls');
				} else {
					$embed.removeAttr('controls');
				}
				if (this.data.get('autoplay') === true) {
					$embed.attr('autoplay', true);
				} else {
					$embed.removeAttr('autoplay');
				}
				if (this.data.get('loop') === true) {
					$embed.attr('loop', true);
				} else {
					$embed.removeAttr('loop');
				}
				this.$el.html($embed);

				this.$el.css('position', 'relative');
				var controls = $('<div class="video-insert-controls">' +
						'<div class="video-insert-controls-panel">' +
						'<div class="image-crop-edit-button image-edit-col-full" title="Swap Video"><input type="button" class="swap-video-insert-button upfront-field upfront-field-button" value="Swap Video" placeholder="Swap Video"></div>' +

						'<div><span>Mute:</span><div class="upfront_toggle"><input ' + (this.data.get('mute') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-mute"> <label class="upfront_toggle_label video-insert-toggle-mute"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'<div><span>Autoplay</span><div class="upfront_toggle"><input ' + (this.data.get('autoplay') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-autoplay"> <label class="upfront_toggle_label video-insert-toggle-autoplay"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'<div><span>Loop</span><div class="upfront_toggle"><input ' + (this.data.get('loop') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-loop"> <label class="upfront_toggle_label video-insert-toggle-loop"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'<div><span>Controls</span><div class="upfront_toggle"><input ' + (this.data.get('controls') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-controls"> <label class="upfront_toggle_label video-insert-toggle-controls"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'</div>' +
						'</div>');
				this.$el.append(controls);
				if (this.controlsOpen) {
					this.$el.find('.video-insert-controls').addClass('video-insert-controls-expanded');
					this.$el.find('.video-insert-controls-panel').toggle();
				}
				// Unwrap from parent `p` since it causes video first added to not be simple output
				// on first redactor exit (also messes up styling)
				if (this.$el.parent().is('p')) {
					this.$el.unwrap();
				}
			},
			swapVideo: function() {
				var videoSelector = new VideoSelector(),
					me = this;

				Upfront.preventRedactorStopOnOutsideClick = true;

				videoSelector.open({multiple_selection: false })
					.done(function(videoData){
						videoSelector.close();
						var newEmbedVideo = $(videoData.embed).find('video').attr('width', parseInt(me.$editor.width(), 10)).attr('height', 'auto').attr('controls', 'controls');
						me.data.set({
							'video_embed': newEmbedVideo,
							'id': videoData.id
						});
						Upfront.preventRedactorStopOnOutsideClick = false;
					});
			},
			toggleMute: function() {
				if (this.data.get('mute') === true) {
					this.data.set('mute', false);
					this.$el.find('.video-insert-toggle-checkbox-mute').removeAttr('checked');
				} else {
					this.data.set('mute', true);
					this.$el.find('.video-insert-toggle-checkbox-mute').attr('checked', 'checked');
				}
			},
			toggleLoop: function() {
				if (this.data.get('loop') === true) {
					this.data.set('loop', false);
					this.$el.find('.video-insert-toggle-checkbox-loop').removeAttr('checked');
				} else {
					this.data.set('loop', true);
					this.$el.find('.video-insert-toggle-checkbox-loop').attr('checked', 'checked');
				}
			},
			toggleAutoplay: function() {
				if (this.data.get('autoplay') === true) {
					this.data.set('autoplay', false);
					this.$el.find('.video-insert-toggle-checkbox-autoplay').removeAttr('checked');
				} else {
					this.data.set('autoplay', true);
					this.$el.find('.video-insert-toggle-checkbox-autoplay').attr('checked', 'checked');
				}
			},
			toggleControls: function() {
				if (this.data.get('controls') === true) {
					this.data.set('controls', false);
					this.$el.find('.video-insert-toggle-checkbox-controls').removeAttr('checked');
				} else {
					this.data.set('controls', true);
					this.$el.find('.video-insert-toggle-checkbox-controls').attr('checked', 'checked');
				}
			},

			importInserts: function(contentElement, insertsData){
				var inserts = {};
				contentElement.find('.uinsert-video-insert').each(function () {
					var $videoInsert = $(this),
						insert,
						$video = $videoInsert.find('video'),
						data = {}
					;

					data.video_embed = $('<div/>').append($video).html();
					data.controls = !! $video.attr('controls');
					data.autoplay = !! $video.attr('autoplay');
					data.loop = !! $video.attr('loop');
					data.mute = !! $video.attr('muted');

					insert = new VideoInsert({data: data});
					inserts[insert.data.id] = insert;
					insert.render();
					$videoInsert.replaceWith(insert.$el);
				});
				return inserts;
			}
		});

		return {
			VideoInsert: VideoInsert
		};
	});
})(jQuery);
