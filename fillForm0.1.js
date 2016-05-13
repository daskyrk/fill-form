javascript: (function() {
  var fs = $tag(document, 'form'),
    i = 0,
    fl = fs.length;

  var on_off = true, //开关
    forms = {}, //所有表单
    mask = getMask(); //遮罩层

  function $id(id) {
    return document.getElementById(id);
  }

  function $tag(parent, name) {
    return parent.getElementsByTagName(name);
  }
  /*******************  追加mask相关dom  **********************/
  function getMask() {
    var mask = document.createElement('div');
    mask.style.cssText = 'background-color:rgba(80,80,80,0.6);position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:9999;';
    var modal = document.createElement('div');
    modal.style.cssText = 'background-color:rgba(200,200,200,1);position:absolute;top:50%;margin-left:-20%;margin-top:-9%;left:50%;width:40%;height:18%;';
    modal.innerHTML = '<h2 style="margin-top:10%;text-align:center;">更新已存储数据还是恢复当前表单数据？</h2>' +
      '<button id="update_formData">更新</button><button id="restore_formData">恢复</button><button id="cancel_formData">取消</button>';
    var btnStyle = 'position:absolute;bottom:25%;width:20%;height:25%;border-radius:5px;border:none;background-color:#eee;font-size:16px;',
      btns = $tag(modal, 'button');
    btns[0].style.cssText = btnStyle + 'left:10%';
    btns[1].style.cssText = btnStyle + 'left:40%';
    btns[2].style.cssText = btnStyle + 'right:10%';
    mask.appendChild(modal);
    return mask;
  }

  //还原设置
  function reset(mask, curForm) {
    document.body.removeChild(mask);
    //开关关闭
    on_off = false;
    // //还原所有设置
    for (var f = 0; f < fl; f++) {
      var curForm = fs[f];
      curForm.style.outline = 'none';
      curForm.style.boxShadow = 'none';
      curForm.onclick = null;
      curForm.onmouseover = null;
      curForm.onmouseout = null;
    }
  }

  function getAllDoms(parent) {
    return {
      inputs: $tag(parent, 'input'),
      selects: $tag(parent, 'select'),
      textareas: $tag(parent, 'textarea')
    };
  }

  function getDoms(typeList) {
    var domsMap = {},
      domsList = [];
    // 处理dom，过滤id或name为空的和非必填的
    for (var k = 0, kl = typeList.length; k < kl; k++) {
      var curDom = typeList[k],
        key = curDom.id.length > 0 ? curDom.id : curDom.name;
      if (curDom.nodeName === 'SELECT' || (curDom.required && key.length > 0)) {
        domsMap[key] = {
          dom: curDom,
          value: curDom.value
        };
        domsList.push(curDom);
      }
    }
    return {
      map: domsMap,
      list: domsList
    };
  }

  function getFormData(allDoms, type) {
    var type_input = getDoms(allDoms['inputs']),
      type_select = getDoms(allDoms['selects']),
      type_textarea = getDoms(allDoms['textareas']);
    return type === 'map' ? {
      inputs: type_input['map'],
      selects: type_select['map'],
      textareas: type_textarea['map']
    } : {
      inputs: type_input['list'],
      selects: type_select['list'],
      textareas: type_textarea['list']
    };
  }


  return (function() {
    if (on_off) {
      for (; i < fl; i++) {
        var curForm = fs[i];
        curForm.style.outline = '1px solid red';
        //鼠标hover
        curForm.onmouseover = function() {
          this.style.boxShadow = '0px 0px 16px 4px #888';
        };

        //鼠标点击
        curForm.onclick = function() {
          document.body.appendChild(mask);

          /*******************  正式逻辑  **********************/
          var form_key = this.id || this.name;
          var allDoms = getAllDoms(this);
          var formData = getFormData(allDoms, 'map');
          var targetDoms = getFormData(allDoms);
          console.info('选择的form:', form_key);

          //更新数据
          $id('update_formData').onclick = function() {
            forms[form_key] = formData;
            //存储，IE6~7 cookie 其他浏览器HTML5本地存储
            if (window.localStorage) {
              console.info(forms);
              localStorage.setItem('formsData', JSON.stringify(forms));
            } else {
              Cookie.write('formsData', forms);
            }
            reset(mask);
          };

          //恢复数据
          $id('restore_formData').onclick = function() {
            var savedData = window.localStorage ? localStorage.getItem('formsData') : Cookie.read('formsData'),
              formsData = savedData === null ? null : JSON.parse(savedData)[form_key];
            for (var type in targetDoms) {
              var typeDoms = targetDoms[type],
                filledDoms = formsData[type],
                domKey = '';
              for (var g = 0, gl = typeDoms.length; g < gl; g++) {
                domKey = typeDoms[g].id || typeDoms[g].name;
                typeDoms[g].value = filledDoms[domKey].value;
              }
            }
            reset(mask);
          };

          //取消
          $id('cancel_formData').onclick = function() {
            reset(mask, curForm);
          };

        };

        //鼠标离开
        curForm.onmouseout = function() {
          this.style.boxShadow = 'none';
        };

      }
    }
  })()
})()