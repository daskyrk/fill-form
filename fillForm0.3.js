javascript: (function() {
  var fs = $tag(document, 'form'),
    i = 0,
    fl = fs.length;

  var forms = {}; //所有表单
  var mask = getMask(); //遮罩层
  var style = getStyle(); //样式

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
    var mask = document.createElement('div');
    mask.id = 'fillForm_mask';
    var modal = document.createElement('div');
    modal.id = 'fillForm_modal';
    modal.innerHTML = '<h2>更新已存储数据还是恢复当前表单数据？</h2>' +
      '<button id=\'update_formData\'>更新</button><button id=\'restore_formData\'>恢复</button><button id=\'cancel_formData\'>取消</button>';
    btns = $tag(modal, 'button');
    btns[0].style.left = '10%';
    btns[1].style.left = '40%';
    btns[2].style.right = '10%';
    mask.appendChild(modal);
    return mask;
  }

  function getStyle() {
    var style = document.createElement('style'),
      str = '#fillForm_mask{background-color:rgba(80,80,80,0.6);position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:9999;} #fillForm_modal{background-color:rgba(200,200,200,1);position:absolute;top:50%;margin-left:-20%;margin-top:-9%;left:50%;width:40%;height:18%;} #fillForm_modal>h2{margin-top:10%;text-align:center;} #fillForm_modal>button{position:absolute;bottom:25%;width:20%;height:25%;border-radius:5px;border:none;background-color:#eee;font-size:16px;transition-duration:0.2s;transition-timing-function:ease-out;} #fillForm_modal>button:hover{box-shadow:0px 0px 10px 1px #666;}';
    style.type = 'text/css';
    if (style.styleSheet) { //ie下
      style.styleSheet.cssText = str;
    } else {
      style.innerHTML = str; //或者写成 style.appendChild(document.createTextstylee(str))
    }
    return style;
  }

  /*******************  还原设置  **********************/
  function reset(mask) {
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
      })
    })
    return dataObj;
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
          reset(mask);
        };

        /*******************  正式逻辑  **********************/
        var form_key = this.id || this.name;
        var doms = getDoms(this);
        var formData = getDataObj(doms);
        console.info('选择的form:', form_key);

        //更新数据
        $id('update_formData').onclick = function(e) {
          e.stopPropagation();
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
        $id('restore_formData').onclick = function(e) {
          e.stopPropagation();
          var formsData = window.localStorage ? localStorage.getItem('formsData') : Cookie.read('formsData');
          var dataObj = formsData === null ? null : JSON.parse(formsData)[form_key];
          if (!dataObj) {
            alert('没有该表单数据，请先填写后保存！');
            reset(mask);
            return;
          }
          var doms = getDoms(curForm);
          var name = '';
          var dom = false;
          each(doms, function(typeList, type) {
            var curTypeData = dataObj[type];
            each(typeList, function(el, i, list) {
              name = el.name.length ? el.name : 'noName';
              sameName = curTypeData[el.type][name];
              sameName && (dom = sameName[0]);
              if (dom) {
                el.value = dom.value;
                el.checked = dom.checked;
                el.selectedIndex = dom.selectedIndex;
              }
              sameName.shift();
            });
          });
          reset(mask);
        };

        //取消
        $id('cancel_formData').onclick = function(e) {
          e.stopPropagation();
          reset(mask);
        };
      };

      //鼠标离开
      curForm.onmouseout = function() {
        this.style.boxShadow = 'none';
      };
    }
  })()
})()
