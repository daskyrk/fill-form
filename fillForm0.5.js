javascript: (function() {
  var fs = $tag(document, 'form'),
    i = 0,
    fl = fs.length,
    forms,
    mask,
    style;

  if (window.__fillForm__) {
    forms = window.__fillForm__.forms;
    mask = window.__fillForm__.mask;
    style = window.__fillForm__.style;
  } else {
    forms = {};
    mask = getMask();
    style = getStyle();
  };

  /*******************  功能性函数  **********************/
  function $id(id) {
    return document.getElementById(id);
  }

  function $tag(parent, name) {
    return parent.getElementsByTagName(name);
  }

  function isArrayLike(collection) {
    var length = collection != null && collection.length;
    return typeof length == 'number' && length >= 0 && length <= (Math.pow(2, 53) - 1);
  };

  function getKeys(obj) {
    if (Object.keys) return Object.keys(obj);
  };

  function each(obj, iteratee) {
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = getKeys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };
  /*******************  追加mask相关dom  **********************/
  function getMask() {
    console.info("getMask执行");
    var mask = document.createElement('div');
    mask.id = 'fillForm_mask';
    var modal = document.createElement('div');
    modal.id = 'fillForm_modal';
    modal.innerHTML = '<h2>更新已存储数据还是恢复当前表单数据？</h2><input type=\'text\' id=\'restore_formData_input\'></input>' +
      '<button id=\'update_formData\'>更新</button><button id=\'restore_formData_cache\'>缓存恢复</button><button id=\'restore_formData_json\'>数据恢复</button><button id=\'cancel_formData\'>取消</button>';
    btns = $tag(modal, 'button');
    btns[0].style.left = '7%';
    btns[1].style.left = '29%';
    btns[2].style.left = '52%';
    btns[3].style.right = '7%';
    mask.appendChild(modal);
    return mask;
  }

  function getStyle() {
    console.info("getStyle执行");
    var style = document.createElement('style'),
      str = '#fillForm_mask{background-color:rgba(80,80,80,0.6);position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:9999;} #fillForm_modal{background-color:rgba(200,200,200,1);position:absolute;top:50%;margin-left:-20%;margin-top:-9%;left:50%;width:40%;height:18%;} #fillForm_modal>h2{position:relative;text-align:center;top:10%;margin:0 auto;} #fillForm_modal>input{position:absolute;left:30%;top:40%;width:40%;height:10%;border-radius:5px;background-color:#eee} #fillForm_modal>button{position:absolute;bottom:15%;width:18%;height:20%;border-radius:5px;border:none;background-color:#eee;font-size:16px;transition-duration:0.2s;transition-timing-function:ease-out;} #fillForm_modal>button:hover{box-shadow:0px 0px 10px 1px #666;}';
    style.type = 'text/css';
    style.media = 'screen';
    if (style.styleSheet) { //ie下
      style.styleSheet.cssText = str;
    } else {
      style.innerHTML = str; //或者写成 style.appendChild(document.createTextstylee(str))
    }
    return style;
  }

  /*******************  还原设置  **********************/
  function reset() {
    document.head.removeChild(style);
    document.body.removeChild(mask);
    //还原所有设置
    for (var f = 0; f < fl; f++) {
      var curForm = fs[f];
      curForm.style.outline = 'none';
      curForm.style.boxShadow = 'none';
      curForm.onclick = null;
      curForm.onmouseover = null;
      curForm.onmouseout = null;
    }
  }

  //获得所有表单元素
  function getDoms(parent) {
    return {
      INPUT: $tag(parent, 'input'),
      SELECT: $tag(parent, 'select'),
      TEXTAREA: $tag(parent, 'textarea')
    };
  }

  //根据表单元素获得数据对象
  function getDataObj(domsObj) {
    var dataObj = {};
    each(domsObj, function(type) {
      each(type, function(el) {
        dataObj[el.nodeName] === undefined && (dataObj[el.nodeName] = {});
        dataObj[el.nodeName][el.type] === undefined && (dataObj[el.nodeName][el.type] = {});
        !el.name.length && (el.name = 'noName');
        dataObj[el.nodeName][el.type][el.name] === undefined && (dataObj[el.nodeName][el.type][el.name] = []);
        dataObj[el.nodeName][el.type][el.name].push({
          // dom: el,
          href: el.href,
          value: el.value,
          checked: el.checked,
          selectedIndex: el.selectedIndex
        })
        el.name === 'noName' && el.removeAttribute('name'); //删除临时增加的name=noName属性
      })
    })
    return dataObj;
  }

  //存储数据，IE6~7使用cookie 其他浏览器使用HTML5本地存储
  function saveData(data, form_key) {
    if (window.localStorage) {
      var formsData = localStorage.getItem('fillForm_formsData');
      var forms = {};
      try {
        formsData && (forms = JSON.parse(formsData));
      } catch (e) {
        alert('已缓存数据不正确，请清空缓存后重试！');
        throw new SyntaxError('缓存数据解析错误');
      }
      forms[form_key] = data;
      var formsJson = JSON.stringify(forms);
      console.info(forms);
      localStorage.setItem('fillForm_formsData', formsJson);
    } else {
      Cookie.read('fillForm_formsData');
      Cookie.write('fillForm_formsData', forms);
    }
    window.__fillForm__ = {
      mask: mask,
      style: style,
      forms: forms
    }
    window.__fillFormJson__ = formsJson;
    console.info("数据json字符串已保存到window.__fillFormJson__中");
  }

  function readData() {
    return window.localStorage ? localStorage.getItem('fillForm_formsData') : Cookie.read('fillForm_formsData');
  }

  //恢复数据
  function restore(curForm, dataObj) {
    var doms = getDoms(curForm);
    var name = '';
    var dom = false;
    each(doms, function(typeList, type) {
      var curTypeData = dataObj[type];
      each(typeList, function(el, i, list) {
        name = el.name.length ? el.name : 'noName';
        sameName = curTypeData[el.type][name];
        sameName && (dom = sameName[0]) && sameName.shift();
        if (dom) {
          el.value = dom.value;
          el.checked = dom.checked;
          el.selectedIndex = dom.selectedIndex;
        }
      });
    });
  }

  return (function() {

    for (; i < fl; i++) {
      var curForm = fs[i];
      curForm.style.outline = '1px solid red';
      //鼠标hover
      curForm.onmouseover = function() {
        this.style.boxShadow = '0px 0px 16px 4px #888';
      };

      //鼠标点击
      curForm.onclick = function() {
        document.head.appendChild(style);
        document.body.appendChild(mask);
        mask.onclick = function(e) {
          e.stopPropagation();
          reset();
        };

        /*******************  正式逻辑  **********************/
        var form_key = this.id || this.name;
        console.info('选择的form:', form_key);

        //更新数据
        $id('update_formData').onclick = function(e) {
          e.stopPropagation();
          var doms = getDoms(curForm);
          var formData = getDataObj(doms);
          saveData(formData, form_key);
          reset();
        };

        //缓存恢复数据
        $id('restore_formData_cache').onclick = function(e) {
          e.stopPropagation();
          var formsData = readData();
          var dataObj = formsData === null ? null : JSON.parse(formsData)[form_key];
          if (!dataObj) {
            alert('没有该表单数据，请先填写后保存！');
            reset();
            return;
          }
          restore(curForm, dataObj);
          reset();
        };

        //json字符串输入
        $id('restore_formData_input').onclick = function(e) {
          e.stopPropagation();
        };

        //json恢复数据
        $id('restore_formData_json').onclick = function(e) {
          e.stopPropagation();
          var $input = $id('restore_formData_input');
          var formsData = $input.value;
          try {
            var formsDataObj = JSON.parse(formsData.slice(1, formsData.length - 1));
          } catch (e) {
            $input.style.border = '1px solid red';
            alert('json字符串数据不正确！');
            throw new SyntaxError('json数据不正确！');
          }
          var dataObj = formsDataObj[form_key];
          if (!dataObj) {
            alert('没有该表单数据，请先填写后保存！');
            reset();
            return;
          }
          restore(curForm, dataObj);
          reset();
        };

        //取消
        $id('cancel_formData').onclick = function(e) {
          e.stopPropagation();
          reset();
        };
      };

      //鼠标离开
      curForm.onmouseout = function() {
        this.style.boxShadow = 'none';
      };
    }
  })()
})()
