/**
 * Custom js script at Add New / Edit Views screen
 *
 * @package   GravityView
 * @author    Zack Katz <zack@katzwebservices.com>
 * @license   ToBeDefined
 * @link      http://www.katzwebservices.com
 * @copyright Copyright 2013, Katz Web Services, Inc.
 *
 * @since 1.0.0
 */


(function( $ ) {

	var fieldOrigin = 'sortable';

	function init_draggables() {

		$("#directory-available-fields, #single-available-fields").find(".gv-fields").draggable({
			connectToSortable: 'div.active-drop',
			distance: 2,
			helper: 'clone',
			revert: 'invalid',
			zIndex: 100,
			containment: 'document',
			start: function() {
				fieldOrigin = 'draggable';
			}
		});

		// Define droppable zone to remove active fields
		$("#directory-available-fields, #single-available-fields").droppable({
			drop: function( event, ui ) {
				if( ui.draggable.find(".gv-dialog-options").length > 0 ) {
					ui.draggable.remove();
					toggleDropMessage();
				}
			}/*
,
			over: function( event, ui ) {
				if( ui.draggable.find(".gv-dialog-options").length > 0 ) {
					console.log('in');
				}
			},
			out: function( event, ui ) {
				console.log('out');
			}
*/
		});
	}


	function init_droppables() {

		$('#directory-active-fields, #single-active-fields').find(".active-drop").sortable({
			placeholder: "fields-placeholder",
			items: '> .gv-fields',
			distance: 2,
			connectWith: ".active-drop",
			receive: function( event, ui ) {

				// Check if field comes from another active area and if so, update name attributes.
				if( ui.item.find(".gv-dialog-options").length > 0 ) {

					var sender_area = ui.sender.attr('data-areaid'),
						receiver_area = $(this).attr('data-areaid');

					ui.item.find( '[name^="fields['+ sender_area +']"]').each( function() {
						var name = $(this).attr('name');
						$(this).attr('name', name.replace( sender_area, receiver_area ) );
					});

				}

				toggleDropMessage();

			}
		}).droppable({
			drop: function( event, ui ) {

				if( 'draggable' === fieldOrigin ) {

					//find active tab object to assign the template selector
					var templateId = '';
					if( 'single-view' === $("#tabs ul li.ui-tabs-active").attr('aria-controls') ) {
						templateId = $("input[name='gravityview_single_template']:checked").val();
					} else {
						templateId = $("input[name='gravityview_directory_template']:checked").val();
					}

					var data = {
						action: 'gv_field_options',
						template: templateId,
						area: $(this).attr('data-areaid'),
						field_id: ui.draggable.attr('data-fieldid'),
						field_label: ui.draggable.find("h5").text(),
						nonce: gvGlobals.nonce,
					};

					$.post( gvGlobals.ajaxurl, data, function( response ) {
						if( response ) {
							ui.draggable.append( response );
						}
					});

					fieldOrigin = 'sortable';

					// show field buttons: Settings & Remove
					ui.draggable.find("span.gv-field-controls").show();

					ui.draggable.find("span.gv-field-controls a[href='#remove']").click( removeField );

					ui.draggable.find("span.gv-field-controls a[href='#settings']").click( openFieldSettings );
				}
			}
		});

	}


	// Event handler to remove Fields from active areas
	function removeField( event ) {
		event.preventDefault();
		var area = $( event.currentTarget ).parents(".active-drop");
		$( event.currentTarget ).parent().parent().remove();
		if( area.find(".gv-fields").length === 0 ) {
			 area.find(".drop-message").show();
		}
	}

	// Event handler to open dialog with Field Settings
	function openFieldSettings( event ) {
		event.preventDefault();
		var parent = $( event.currentTarget ).parent().parent();
		parent.find(".gv-dialog-options").dialog({
			dialogClass: 'wp-dialog',
			appendTo: parent,
			width: 550,
			closeOnEscape: true,
			buttons: [ {
				text: gvGlobals.label_close,
				click: function() {
					$(this).dialog('close');
				}
			}],
		});
	}

	// Event handler to open dialog with Widget Settings
	function openWidgetSettings( event ) {
		event.preventDefault();
		var parent = $( event.currentTarget ).parent();
		parent.find(".gv-dialog-options").dialog({
			dialogClass: 'wp-dialog',
			appendTo: parent,
			width: 350,
			closeOnEscape: true,
			buttons: [ {
				text: gvGlobals.label_close,
				click: function() {
					$(this).dialog('close');
				}
			} ],
		});
	}

	function toggleDropMessage() {
		$(".active-drop").each( function() {
			if( $(this).find(".gv-fields").length !== 0 ) {
				$(this).find(".drop-message").hide();
			} else {
				$(this).find(".drop-message").show();
			}
		});
	}


	var currentFormId = '', gvSelectForm,
	viewFormSelect = {

		init: function() {
			//start fresh button
			var gvStartFreshButton = $('a[href="#gv_start_fresh"]');
			//select form dropdown
			gvSelectForm = $('#gravityview_form_id');
			//current form selection
			currentFormId = gvSelectForm.val();

			if( '' === currentFormId ) {
				viewFormSelect.hideView();
			} else {
				viewFormSelect.showView();
			}

			// start fresh
			gvStartFreshButton.click( function(e) {
				e.preventDefault();
				viewFormSelect.startFresh();
			});

			// select form
			gvSelectForm.change( viewFormSelect.changed );


		},

		hideView: function() {
			currentFormId = '';
			$("#gravityview_directory_view, #gravityview_select_template").slideUp(150);
			$("#directory-available-fields, #directory-active-fields, #single-available-fields, #single-active-fields").find(".gv-fields").remove();
		},

		showView: function() {
			$("#gravityview_select_template").slideDown(150);
		},

		startFresh: function(){
			if( currentFormId !== '' ) {
				viewFormSelect.showDialog();
			} else {
				viewFormSelect.templateFilter('preset');
				viewFormSelect.showView();
			}

		},

		changed: function() {

			if( currentFormId !== ''  && currentFormId !== $(this).val() ) {
				viewFormSelect.showDialog();
			} else {
				viewFormSelect.getNewFields();
			}
		},

		showDialog: function() {

			var thisDialog = $('#gravityview_form_id_dialog');

			thisDialog.dialog({
				dialogClass: 'wp-dialog',
				appendTo: thisDialog.parent(),
				closeOnEscape: true,
				buttons: [ {
					text: gvGlobals.label_cancel,
					click: function() {
						gvSelectForm.val( currentFormId );
						thisDialog.dialog('close');
					} }, {
					text: gvGlobals.label_continue,
					click: function() {
						if( '' === gvSelectForm.val() ) {
							viewFormSelect.hideView();
						} else {
							viewFormSelect.getNewFields();
						}
						thisDialog.dialog('close');
					}
				} ],
			});

		},

		templateFilter: function( type ) {
			var templateType = type;
			$(".gv-view-types-module").each( function() {
				if( $(this).attr('data-filter') === templateType ) {
					$(this).parent().show();
				} else {
					$(this).parent().hide();
				}
			});
		},

		getNewFields: function() {

			currentFormId = gvSelectForm.val();

			$("#directory-available-fields, #directory-active-fields, #single-available-fields, #single-active-fields").find(".gv-fields").remove();

			var data = {
				action: 'gv_available_fields',
				formid: currentFormId,
				nonce: gvGlobals.nonce,
			};

			$.post( gvGlobals.ajaxurl, data, function( response ) {
				if( response ) {
					$("#directory-available-fields fieldset.area").append( response );
					$("#single-available-fields fieldset.area").append( response );
					init_draggables();
				}
			});

			toggleDropMessage();
			viewFormSelect.showView();
		}

	};



	function viewTemplatePicker( type ) {

		var thisType = type;

		this.init = function() {

			if( thisType != 'single' && thisType != 'directory' ) {
				return;
			}

			// assign selected class
			$('input[name="gravityview_'+ thisType +'_template"]:checked').parents(".gv-template").addClass('gv-selected');

			//
			$('#gravityview_'+ thisType +'_template_change').click( this.showDialog );

			// action when template changes
			$('input[name="gravityview_'+ thisType +'_template"]').change( this.changed );


		};

		this.showDialog = function( e ) {
			e.preventDefault();

			var $thisDialog = $('#gravityview_'+ thisType +'_template_dialog');

			$thisDialog.dialog({
				dialogClass: 'wp-dialog',
				width: 600,
				appendTo: $thisDialog.parent(),
				closeOnEscape: true,
				buttons: [ {
					text: gvGlobals.label_ok,
					click: function() {
						$thisDialog.dialog('close');
					} },
				],
			});
		};

		this.changed = function() {

			$('#'+ thisType +'-active-fields').find("fieldset.area").remove();

			var data = {
				action: 'gv_get_active_areas',
				template_id: $(this).val(),
				nonce: gvGlobals.nonce,
			};

			$.post( gvGlobals.ajaxurl, data, function( response ) {
				if( response ) {
					$('#'+ thisType +'-active-fields').append( response );
					init_droppables();
				}
			});

			//change class to highlight the selection
			var $parent = $(this).parents(".gv-template");
			$parent.siblings().removeClass('gv-selected');
			$parent.addClass('gv-selected');

			//update the template name when dialog is closed
			$('#gravityview_'+ thisType +'_template_name').text( $(this).next("img").attr('alt') );

		};
	}


	$(document).ready( function() {
		// assign form to this view (logic)
		viewFormSelect.init();

		var directoryTemplatePicker = new viewTemplatePicker('directory'),
			singleTemplatePicker = new viewTemplatePicker('single');

		directoryTemplatePicker.init();
		singleTemplatePicker.init();

		// View Configuration - Tabs (persisten after refresh)
		$("#tabs").tabs({
			active: $("#gv-active-tab").val(),
			activate: function( event, ui ) {
				$("#gv-active-tab").val( ui.newTab.parent().children().index( ui.newTab ) );
			}
		});


		// Directory View Configuration - Fields Mapping


		init_draggables();

		init_droppables();

		$("a[href='#remove']").click( removeField );

		$("a[href='#settings']").click( openFieldSettings );

		// toggle view of "drop message" when active areas are empty or not.
		toggleDropMessage();



		// Directory View Configuration - Widgets
		$("a[href='#widget-settings']").click( openWidgetSettings );


		// test tooltips
		$(".gv-add-field").tooltip({
			content: function() {
				var objType = $(this).attr('data-objecttype');
				if( objType === 'field' ) {
					return $("#directory-available-fields").html();
				} else if( objType === 'widget' ) {
					return $("#directory-available-widgets").html();
				}
			},
			disabled: true,
			position: {
				my: "center bottom",
				at: "center top-12",
			},
			tooltipClass: 'top',
			}).on('mouseout focusout', function(e) {
                  e.stopImmediatePropagation();
             }).click( function(e) {
				e.preventDefault();
				if( $(this).attr('data-tooltip') !== undefined && $(this).attr('data-tooltip') == 'active' ) {
					$(this).tooltip("close");
					$(this).attr('data-tooltip', '');
				} else {
					$(this).tooltip("open");
					$(this).attr('data-tooltip', 'active');
				}
		});

        // close all tooltips if user clicks outside the tooltip
        $(document).mouseup( function (e) {
		    var activeTooltip = $("a.gv-add-field[data-tooltip='active']");
		    if( !activeTooltip.is( e.target ) && activeTooltip.has( e.target ).length === 0 ) {
		        activeTooltip.tooltip("close");
		        activeTooltip.attr('data-tooltip', '');
		    }
		});


		// Make zebra table rows
		$("table.form-table tr:even").addClass('alternate');

	});

}(jQuery));
