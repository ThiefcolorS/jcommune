/*
 * Copyright (C) 2011  JTalks.org Team
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

/**
 * This script provides jQuery contextMenu functionality.
 * using: jquery.contextMenu.js - context menu functionality
 *        jquery-fieldselection.js - for get textarea selection
 *        textarea-helper.js - for get caret position
 */

jQuery(document).ready(function () {
    var baseUrl = $root;
    //saved position of '@' character, -1 mean not exist
    var atPosition = -1;

    $('#tbMsg').keyup(autocompleteOnChange);

    function autocompleteOnChange(e) {
        var selStart = $(e.target).getSelection().start;
        var textBeforeCaretPos = $(e.target).val().substr(0, selStart);
        //exclude situation when '@' exists in previously added username
        var lastAddedUsernamePos = textBeforeCaretPos.lastIndexOf('[/user]');
        var lastAtPos = textBeforeCaretPos.lastIndexOf('@');
        if (lastAtPos >= 0 && lastAtPos > lastAddedUsernamePos) {
            // When user clicks on the page area we add 'resetPattern' class to the textarea element.
            // Here we reset saved pattern and remove this temporary class.
            if ($(e.target).hasClass('resetPattern')) {
                resetAutocompletePattern();
                $(e.target).removeClass('resetPattern');
            }
            if (atPosition >= 0) {
                lastAtPos = atPosition;
            }
            var pattern = textBeforeCaretPos.substr(lastAtPos + 1);
            var keycodeApproved = (e.keyCode != upCode && e.keyCode != downCode
                && e.keyCode != enterCode && e.keyCode != escCode);
            // show contextMenu only if there are space or new line before @, or @ is a first symbol in post/pm
            var posApproved = (lastAtPos == 0 || textBeforeCaretPos.charAt(lastAtPos - 1) == ' '
                || textBeforeCaretPos.charAt(lastAtPos - 1) == '\n');
            if (keycodeApproved) {
                if (posApproved) {
                    atPosition = lastAtPos;
                    if (pattern.length > 0) {
                        getContextMenu(pattern, e.target);
                    }
                } else {
                    hideContextMenu();
                }
            }
            if (e.keyCode == enterCode || e.keyCode == escCode) {
                resetAutocompletePattern();
            }
        } else {
            hideContextMenu();
            resetAutocompletePattern();
        }
    }

    function resetAutocompletePattern() {
        atPosition = -1;
    }

    function getContextMenu(pattern, textarea) {
        $.ajax({
            type: 'POST',
            url: baseUrl + '/usernames',
            data: {pattern: pattern},
            success: function (data) {
                if (data.result && data.result.length > 0) {
                    var items = {};
                    $.each(data.result, function (key, username) {
                        username = escapeHtml(username);
                        items[username] = {name: username};
                    });
                    createContextMenu(textarea, items);
                } else {
                    hideContextMenu();
                }
            }
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeHtmlReverse(safe) {
        return safe
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, "\"")
            .replace(/&#039;/g, "'");
    }

    function hideContextMenu() {
        $.contextMenu('destroy');
    }

    function createContextMenu(textarea, items) {
        hideContextMenu();
        $.contextMenu({
            selector: '#' + textarea.id,
            trigger: 'none',
            className: 'autocompleteContextMenu',
            callback: function (username, options) {
                var selection = $(textarea).getSelection();
                var textBeforeCaretPos = $(textarea).val().substr(0, selection.start);
                var lastAtPos = (atPosition >= 0 ? atPosition : textBeforeCaretPos.lastIndexOf('@'));
                username = escapeHtmlReverse(username);
                textarea.value = textarea.value.slice(0, lastAtPos) + '[user]' + username + '[/user]'
                    + textarea.value.slice(selection.end);
                hideContextMenu();
                resetAutocompletePattern();
            },
            items: items
        });
        if ($.browser.mozilla) {
            setTimeout(function () {
                showContextMenu(textarea);
            }, 0);
        } else {
            showContextMenu(textarea);
        }
    }

    function showContextMenu(el) {
        //context menu coordinates
        var xPos;
        var yPos;
        var rowHeight = 24;
        var offsetMenuInTextArea = $(el).textareaHelper('caretPos');
        if ($.browser.opera) {
            xPos = offsetMenuInTextArea.left;
            yPos = offsetMenuInTextArea.top + rowHeight;
        } else {
            var textAreaOffset = $(el).offset();
            xPos = textAreaOffset.left + offsetMenuInTextArea.left;
            yPos = textAreaOffset.top + offsetMenuInTextArea.top + rowHeight;
        }

        $('#' + el.id).contextMenu({x: xPos, y: yPos});
    }

});