
//////////////////////////////////////////////////////////////////////////
// Tree
//////////////////////////////////////////////////////////////////////////
var TTtreeDraggingElement;
var TTtreeHoverBorderStyle = '2px dashed #999';
var TTtreeNormalBorderStyle = '';

function TTtreeDebugMessage(s)
{
  var elStatus;

  if (!elStatus) elStatus = $('#TTtreeDebugMessage')[0];
  if (!elStatus) return;
  if (s) elStatus.innerHTML = 'TREE DEBUG:' + s;
  else elStatus.innerHTML = '&nbsp;';
}

var TTpopulateEditorFunction = undefined;

function TTwireUpTree(populateEditorFunction)
{
  TTpopulateEditorFunction = populateEditorFunction;
  TTwireUpTreeNodes($(".tree"));
  TTreindexTree(9000);
}

function TTwireUpTreeNodes(jqNodesToWire)
{
  var treeDraggable = TTtreeDraggableElements(jqNodesToWire);
  var treeDroppable = TTtreeDroppableElements(jqNodesToWire);

  treeDraggable.bind("dragstart", function (e)
  {
    TThandleDragStart(e);
  });
  treeDraggable.bind("dragend", function (e)
  {
    TThandleDragEnd(e);
  });

  treeDroppable.bind("dragover", function (e)
  {
    TThandleDragOver(e);
  });
  treeDroppable.bind("dragenter", function (e)
  {
    TThandleDragEnter(e);
  });
  treeDroppable.bind("dragleave", function (e)
  {
    TThandleDragLeave(e);
  });
  treeDroppable.bind("drop", function (e)
  {
    TThandleDrop(e);
  });

  var treeNodes = treeDraggable;

  // wire up the key up event.  These are the actions
  // taken when user releases the key...  such as enterkey to edit
  // and space bar to expand/collapse
  treeNodes.keyup(function (e)
  {
    TTtreeNodeKeyUp(e, $(this));
  });

  // wire up the key press event.  These are the actions that the
  // user might want to take many time while holding down the key
  // such as arrow up & down
  treeNodes.keydown(function (e)
  {
    TTtreeNodeKeyDown(e, $(this));
  });

  treeNodes.click(function (e)
  {
    TTtreeNodeClick(e, $(this));
  });

  treeNodes.dblclick(function (e)
  {
    TTeditTreeNode(e, $(this));
  });

  treeNodes.focus(function (e)
  {
    TTsetTreeNodeFocus(e, $(this));
  });

}

function TTeditorDelete()
{
  var jqEditor = $("#tree-editor");
  var jqNode = jqEditor.parent();
  TTclearAndSaveTreeEditor(undefined, jqEditor);
  TTdeleteTreeNode(jqNode);
}

function TTeditorCancel()
{
  TTclearAndSaveTreeEditor(undefined, $("#tree-editor"), true);
}

function TTeditorClose()
{
  TTclearAndSaveTreeEditor(undefined, $("#tree-editor"), true);
}

function TTeditorDetails()
{
  alert("show me the details!!!!");
}

function TTdeleteTreeNode(jqNode)
{
  var containingLI = jqNode.parent();
  var containingUL = containingLI.parent();

  //  TODO:  Call external function to delete the data
 
  // need to move the selected item what will be the next one in the 
  // tree.  We can reuse the arrow key functions, but need to hide
  // the current node first so its not selected
  containingLI.hide();
  newNode = TTtreeStep(undefined, jqNode, false);

  // remove the LI from the containing list
  containingLI.remove();

  // remove the UL from the LI that contains it if there are
  // no more children in it
  if (containingUL.has(".tree-node").length == 0)
  {
    containingUL.remove();
    TTreindexTree(9000, newNode.attr("id"));
  }
}

function TTreindexTree(startingIndex, initialSelectionId)
{
  // this adds tab indexes to each node.  Causes problems, so removing
  // tabbing all together.  It is replaced with other keyboard functions
  $(".tree-outer .tree-node").each(function (e)
  {
    $(this).attr("tabindex", startingIndex++);
  });

  var initialSelection = $("#" + initialSelectionId);
  if (initialSelection.length == 0)
  {
    initialSelection = $(".tree-outer:first .tree-node:first");
  }

  initialSelection[0].focus();

  //reset the expand/collapse commands
  //find all of the li's that contain tree nodes
  var nodeItems = $(".tree-node-list .tree-node-nav").parent().parent();

  nodeItems.each(function (e)
  {
    var innerList = $(this).children("ul.tree-node-list");

    if (innerList.length > 0)
    {
      // if the the LI node contains UL, its a parent, and needs an
      // expand/collapse control on it
      if (!innerList.isDisplayOn)
      {
        $(this).children(".tree-node").children(".tree-node-nav").addClass("TT-expanded");
      }
      else
      {
        $(this).children(".tree-node").children(".tree-node-nav").addClass("TT-collapsed");
      }
    }
    else
    {
      // if the the LI node does not contain UL, should not have an expand/collapse
      $(this).children(".tree-node").children(".tree-node-nav").removeClass("TT-expanded").removeClass("TT-collapsed");
    }
  });

  // TODO: probably a more efficient way to do this
  $('.tree-node-nav').off('click');
  $(".tree-node-nav.TT-expanded, .tree-node-nav.TT-collapsed").click(function (e)
  {
    TTtoggleTreeNode($(this).parent());
  });

}

function TTtreeDraggableElements(nodesToWire)
{
  return nodesToWire.find(".tree-node");
}

function TTtreeDroppableElements(nodesToWire)
{
  return nodesToWire.find(".tree-node, .tree-sibling-dropzone");
}

function TTtoggleTreeNode(jNode)
{
  var theList = jNode.next("ul")[0];
  var isDisplayOn = theList.style.display == "";
  theList.style.display = (isDisplayOn) ? 'none' : "";

  var navNode = jNode.children("div.tree-node-nav:first");
  if (isDisplayOn)
  {
    navNode.removeClass("TT-expanded").addClass("TT-collapsed");
  }
  else
  {
    navNode.removeClass("TT-collapsed").addClass("TT-expanded");
  }
}

function TTsetTreeNodeFocus(event, jqNode)
{
  var treeEditor =  $("#tree-editor");

  // if the editor is currently visible, and the current node
  // is not the same one thats being selected, then we need to
  // close the editor
  if (treeEditor.parent().hasClass("tree-node")
      && treeEditor.parent().attr("id") != jqNode.attr("id"))
  {
    TTclearAndSaveTreeEditor(event,treeEditor);
  }
}

function TTeditTreeNode(event, jqElement)
{
  var editor = $("#tree-editor");

  // if the editor is already editing a node, clear it
  TTclearAndSaveTreeEditor(event, editor);

  // first, relocate the tree-node-body into the editor
  editor.prepend(jqElement.children(".tree-node-body"));

  // then, move the editor into tree node
  jqElement.append(editor);

  // finally call an external function to populate the editor controls
  TTpopulateEditorFunction(editor, jqElement);

  // need to unbind the events from the node so user can type
  // without triggering them
  jqElement.off('keyup');
  jqElement.off('keydown');
}

function TTclearAndSaveTreeEditor(event, jqEditor, setFocusToCurrentNode)
{
  var editingBody = jqEditor.children(".tree-node-body");
  if (editingBody.length > 0)
  {
    // TODO: call extrnal function to save
    var editorForm = $("#tree-editor-form");

    $.ajax(
    {
      type: editorForm.attr("method"),
      url: editorForm.attr("action"),
      data: editorForm.serialize(),
      success: function(data) { alert("success: " + data); },
      error: function(jqXHR, stat, err) { alert("error: " + err); },
    });

    var jqNode = jqEditor.parent();
    // move the editing body back to the tree-node.  it had
    // been inserted into the editor
    jqNode.append(editingBody);

    // move the tree editor back to the closet
    $("#hidden-closet").append(jqEditor);
 
    // need to re-wire key press events since we unhooked them
    // when we opened the editor
    jqNode.keyup(function (e)
    {
      TTtreeNodeKeyUp(e, $(this));
    });
    jqNode.keydown(function (e)
    {
      TTtreeNodeKeyDown(e, $(this));
    });  

    if (setFocusToCurrentNode != undefined
        && setFocusToCurrentNode == true)
    {
      jqNode.focus();
    }
  }
}

var TTshouldSelectNext = false;
function TTtreeNodeClick(event, jqElement)
{
  var isShiftKey = event.shiftKey;
  var isControlKey = event.ctrlKey;

  var previousCurrentNode = $(".tree-node.current");

  if (isShiftKey)
  {
    // the shift key will select a range of nodes, but only works
    // if the parent of the selected node is the same as the 
    // currently selected node

    // start off my clearing everythign else
    $(".tree-node.selected").removeClass("selected");

    // parent.parent is the containing UL.  If they are the same, we are
    // working with nodes in the same list
    if (jqElement.parent().parent().attr("id") 
        == previousCurrentNode.parent().parent().attr("id"))
    {
      var siblingItems = jqElement.parent().parent().children().has(".tree-node");
      shouldSelectNext = false;

      siblingItems.each(function ()
      {
        //only take action if we are operating on a tree node
        var stopSelectingAfterThisOne = false;
        // if we hit either the clicked node or the original node,
        // need to change what we are doing

        var thisTreeNode = $(this).children(".tree-node");

        if (thisTreeNode.attr("id") == jqElement.attr("id") 
          && thisTreeNode.attr("id") == previousCurrentNode.attr("id"))
        {
          // if the currently selected node is the one that was clicked
          // need to select this one and stop selecting all others
          stopSelectingAfterThisOne = true;
          shouldSelectNext = true;
        }
        else
        {
          if ((thisTreeNode.attr("id") == jqElement.attr("id")) 
            || (thisTreeNode.attr("id") == previousCurrentNode.attr("id")))
          {
            if (shouldSelectNext)
            {
              //if we are in the mode of selecting items of the current
              // node was the one that was shift-clicked, we need
              //to select this item too, then transition off of selection mode
              stopSelectingAfterThisOne = true;
            }
            else
            {
              //if we have not started selecting yet, we need to start
              // selecting
              shouldSelectNext = true;
            }
          }
        }
        if (shouldSelectNext)
        {
          thisTreeNode.addClass("selected");
        }
        else
        {
          thisTreeNode.removeClass("selected");
        }
        if (stopSelectingAfterThisOne)
        {
          shouldSelectNext = false;
        }
      });
    }
  }
  else if (isControlKey)
  {
    // the control key is an exact multi-select.
    if (jqElement.hasClass("selected"))
    {
      jqElement.removeClass("selected");
    }
    else
    {
      jqElement.addClass("selected");
    }
  }
  else
  {
    // if this is not a multi-select request, clear all selected
    // elements and just be sure the current element is selected
    $(".tree-node.selected").removeClass("selected");
    jqElement.addClass("selected");
  }

  if (!isShiftKey)
  {
    // if this is not a shift-select, the clicked node should be the current node,
    // and there sould only ever be one
    previousCurrentNode.removeClass("current");
    jqElement.addClass("current");
  }
}

function TTtreeNodeKeyUp(event, jqNode)
{
  event = event || window.event;
  var charCode = event.charCode || event.keyCode;

  var isShiftKey = event.shiftKey;

  if (charCode == 13)
  { // enter key, edit the row
    TTeditTreeNode(event, jqNode);
  }
  else if (charCode == 32)
  { // space bar, expand/contract tree node
    alert("Fix me to expand/contract");
  }
  else if (charCode == 45)
  { // insert key, create a child
    TTinsertNewTreeNode(jqNode);
  }
  else if (charCode == 46)
  { // delete key, warn and delete
    TTdeleteTreeNode(jqNode);
  }
  else if (charCode == 40)
  { // down arrow key
    if (isShiftKey)
    {
      alert("Fix me to toggle selection of the current row and move to the next");
    }
  }
  else if (charCode == 38)
  { // up arrow key
    if (isShiftKey)
    {
      alert("Fix me to toggle selection of the current row and move to the previous");
    }
  }
  else if (charCode == 39)
  { //right arrow
    alert("Fix me to indent the current node");
  }
  else if (charCode == 37)
  { // left arrow
    alert("Fix me to un-indent");
  }
}

function TTtreeNodeKeyDown(event, jqNode)
{
  event = event || window.event;
  var charCode = event.charCode || event.keyCode;

  var isShiftKey = event.shiftKey;

  var cancelDefaultAction = false;

  if (charCode == 40)
  { // down arrow key
    if (!isShiftKey)
    {
      cancelDefaultAction = true;
      TTtreeStep(event, jqNode, false);
    }
  }
  else if (charCode == 38)
  { // up arrow key
    if (!isShiftKey)
    {
      cancelDefaultAction = true;
      TTtreeStep(event, jqNode, true);
    }
  }

  if (cancelDefaultAction)
  {
    event.preventDefault();
  }
}


var TTtreeNodeCounter = 1;
function TTinsertNewTreeNode(jqNode)
{
  //if the current node is a parent, add the new node as the last child.
  //if current node is childless, insert the new node as a lower sibling
  
  //create the new node
  //  TODO:  pretty lazy approach here
  var newNode = $('\
<li> \
<div draggable="true" class="tree-node" data-storyid="new">\
<div class="tree-node-nav">\
    <div class="tree-node-command"></div>\
    <div class="tree-node-fill"></div>\
</div>\
<div class="tree-node-function"></div>\
<div class="tree-node-function"></div>\
<div class="tree-node-body">\
  As an \
  <span class="story-actor"></span> \
  I want to \
  <span class="story-wantto"></span> \
  so I can\
  <span class="story-soican"></span> \
</div>\
</div>\
<div id="Li3" class="tree-sibling-dropzone">\
<div class="tree-node-nav"></div>\
</div>\
</li>');

  // insert the new node as a sibling after current node
  jqNode.after(newNode);

  // wire up the events for the new node
  TTwireUpTreeNodes(newNode);

  var newTreeNode = newNode.find(".tree-node");
  newTreeNode.attr("id", "treenodeid_" + TTtreeNodeCounter++);

  TTreindexTree(9000, newTreeNode.attr("id"));
  // startup the editor
  TTeditTreeNode(undefined, newNode.find(".tree-node"));
}

function TTfindNextVisibleTreeNode(jqNode, isUp)
{
  // this should be the LI that contains the current node
  var containingLI = jqNode.parent();
  jqNode.removeClass("selected");

  // find the next node
  var nextLI = undefined;
  var nodeToSelect = undefined;

  if (isUp)
  {
    nextLI = containingLI.prev("li").has(".tree-node");
    if (nextLI.length == 0)
    {
      // if there was no big brother of this node, we have reached
      // the top of the current list.  Need to jump to the parent
      // of the containing list.  In this case, need to select the
      // node that represents the root of the list
      nodeToSelect = containingLI.parent().parent().children(".tree-node:visible:first");
      if (nodeToSelect.length == 0)
      {
        // if we have run out of things to move to, just stay at the first one in the tree
        nodeToSelect = $(".tree-node:visible:first");
      }
    }
    else if (nextLI.has("ul").length > 0)
    {
      // if the chosen LI contains a UL, it is a parent.
      // when moving up, we need to select the lowest visible child 
      // instead of selecting the parent node
      nodeToSelect = nextLI.find(".tree-node:visible:last");
    }
    else
    {
      nodeToSelect = nextLI.children(".tree-node:visible");
    }
  }
  else // moving down, bit different
  {
    // if the current node has a UL in it, it is a root of another list
    // the first node in it should be selected
    nodeToSelect = containingLI.children("ul").find(".tree-node:visible:first");

    if (nodeToSelect.length == 0)
    {
      // the node was not a root of another list.  Get try to get the
      // next sibling instead
      nextLI = containingLI.next("li").has(".tree-node:visible");
      if (nextLI.length > 0)
      {
        // found a sibling, use it
        nodeToSelect = nextLI.children(".tree-node:visible");
      }
      else
      {
        // ran out of siblings to pick. go back up to the parent
        // and nav down from there
        nextLI = TTgetFirstUncleRecursively(containingLI);
        // must have hit the end of the list
        if (nextLI == undefined)
        {
          // if we have run out of nodes, to select, just stay on the
          // last one in the list
          nodeToSelect = $(".tree-node:visible:last");
        }
        else
        {
          nodeToSelect = nextLI.children(".tree-node:visible");
        }
      }
    }
  }
  return nodeToSelect;
}

function TTtreeStep(event, jqNode, isUp)
{
  var nodeToSelect = TTfindNextVisibleTreeNode(jqNode, isUp);

  // mark the selected node as selected
  nodeToSelect.addClass("selected");
  nodeToSelect.focus();

  return nodeToSelect;
}

function TTgetFirstUncleRecursively(nodeLI)
{
  // first parent is the UL...  next parent should be LI
  var parentLI = nodeLI.parent().parent("li");
  if (parentLI.length == 0)
  {
    return undefined;
  }
  
  var youngUncle = parentLI.next("li").has(".tree-node:first");
  if (youngUncle.length == 0)
  {
    return TTgetFirstUncleRecursively(parentLI);
  }

  return youngUncle;
}

function TThandleDragStart(e)
{
  TTtreeDraggingElement = e.currentTarget;
  $(TTtreeDraggingElement).addClass('moving');
  TTtreeDebugMessage('Drag ' + TTtreeDraggingElement.id);
  TTtreeDraggingElement.style.opacity = '0.5';
  TTtreeDraggingElement.style.border = TTtreeHoverBorderStyle;
}

function TThandleDragEnd(e)
{
  e.currentTarget.style.opacity = '1.0';

  // reset the element style
  $(TTtreeDraggingElement).removeClass('moving');
  TTtreeDraggingElement = undefined;

  var nodesToReset = $("li").has(".tree-sibling-dropzone");
  var treeDraggable = TTtreeDraggableElements(nodesToReset);
  var treeDroppable = TTtreeDroppableElements(nodesToReset);

  // reset all of the elements
  for (var i = 0; i < treeDroppable.length; i++)
  {
    treeDroppable[i].style.border = TTtreeNormalBorderStyle;
  }
  for (var i = 0; i < treeDraggable.length; i++)
  {
    treeDraggable[i].style.border = TTtreeNormalBorderStyle;
  }
}

function TThandleDragOver(e)
{
  if (e.preventDefault) e.preventDefault();
  e.currentTarget.style.border = TTtreeHoverBorderStyle;

  return false; // some browsers may need this to prevent default action
}

function TThandleDragEnter(e)
{
  if (this !== TTtreeDraggingElement) 
  {
    TTtreeDebugMessage('Hover ' + TTtreeDraggingElement.id + ' over ' + this.id);
  }
  e.currentTarget.style.border = TTtreeHoverBorderStyle;
}

function TThandleDragLeave(e)
{
  e.currentTarget.style.border = TTtreeNormalBorderStyle;
}

function TThandleDrop(e)
{
  if (e.stopPropegation) e.stopPropagation(); // Stops some browsers from redirecting.
  if (e.preventDefault) e.preventDefault();
  TTdropInto(e.currentTarget, TTtreeDraggingElement);
}

// utility functions
function TTdropInto(into, droppingNode)
{

  if (into.id == droppingNode.id)
  {
    TTtreeDebugMessage('im not a snake');
    return;
  }
  TTtreeDebugMessage('dropped ' + droppingNode.id + ' into ' + into.id);

  var droppingNodeContainer = $(droppingNode).parent();
  var droppingNodeContainerParentList = $(droppingNodeContainer).parent();
  var intoNodeContainer = $(into).parent();

  // figure out what is being dropped into
  var jInto = $(into);
  if (jInto.hasClass("tree-sibling-dropzone"))
  {
    TTtreeDebugMessage('creating a sibling of ' + into.id);
    // in this case, the dragging tree node was dropped into a sibling
    // dropzone.  We need to find the parent of the dropzone, which is
    // an li that contains the new big brother of the dropped element.
    // we need to relocate the entire parent LI of the dropping node
    intoNodeContainer.after(droppingNodeContainer);
  }
  else if (jInto.hasClass("tree-node"))
  {
    TTtreeDebugMessage('creating a child of ' + into.id);
    // in this case, we are dragging into a node.  Add the dragged node
    // as a child of the into node.  If the into node is already a parent
    // (i.e. already has an associated UL), then just append the dropped
    // node as a new child. Otherwise, need to create a new UL for
    // the into node first.
    var intoNodeChildList = jInto.next("ul");
    if (intoNodeChildList.length == 1)
    {
      droppingNodeContainer.appendTo(intoNodeChildList);
    }
    else if (intoNodeChildList.length == 0)
    {
      intoNodeChildList = TTbuildNewTreeList();
      jInto.after(intoNodeChildList);
      droppingNodeContainer.appendTo(intoNodeChildList);
    }
    else
    {
      TTtreeDebugMessage(into.id + ' has more than one child list!?!?!?');
    }


  }
  else
  {
    TTtreeDebugMessage('HMMMM.... not sure what this is ' + into.id);
  }

  if (droppingNodeContainerParentList.children().length <= 1)
  {
    droppingNodeContainerParentList.remove();
  }

  TTreindexTree(9000, droppingNode.id);
}

var newListCounter = 1;

function TTbuildNewTreeList()
{
  //var retVal = $('<ul> \
  //    </ul>');
  var retVal = $('<ul class="tree-inner tree-node-list"> \
            <li> \
                <div class="tree-sibling-dropzone"> \
                    <div class="tree-node-nav"></div> \
                </div> \
            </li> \
        </ul>').attr("id", "newList_" + newListCounter++);
  return retVal;
}

