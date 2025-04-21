// VUE2 Element 定制版，使用原生 Element 样式

/* eslint-disable no-underscore-dangle */
// 监听 ajax请求，自动为匹配到的 dom 元素添加点击约束
import { Loading as ElLoading } from '@bihu/element-ui'

/**
 *  使用例子
 * @param {string} element-loading-text           加载文案
 * @param {string} element-loading-spinner        自定义加载图标
 * @param {string} element-loading-background     遮罩背景色
 * @param {string} element-loading-custom-class   自定义类名
 * @example <div v-waiting="['get::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']" @click="test">点击</div>
 * @example <div v-waiting="'get::http://www.baidu.com/mock/50/test/users?pageIndex=2'" @click="test1">点击</div>
 * @example <div v-waiting="userApi.postLogin" @click="test1">兼容传入 axios 请求函数</div>
 * @example
 <div
   v-waiting="'get::http://www.baidu.com/mock/50/test/users?pageIndex=2'"
   element-loading-text="Loading..."
   element-loading-spinner="svg"
   element-loading-background="rgba(0, 0, 0, 0.8)"
   element-loading-custom-class="custom-class"
 >点击</div>
 */

// 样式是参考element 的Loading 组件 https://element.eleme.cn/#/zh-CN/component/loading，做一些二次开发修改
let minMillisecondTimeForShow = 200 // 最小显示的毫秒时间，避免加载中样式一闪而过，没有充分显示
const waitingDirective = {}
waitingDirective.install = v => {

  // 注入全局方法
  (function () {
    // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
    if (window.hadResetAjaxForWaiting) {
      return
    }
    window.hadResetAjaxForWaiting = true
    window.waitingAjaxMap = {} // 接口映射 {'get::http://www.baidu.com/mock/50/test/users?pageIndex=1': dom}

    // 保存一份原生的 XMLHttpRequest 对象 和 open 方法
    let OriginXHR = window.XMLHttpRequest
    let originOpen = OriginXHR.prototype?.open || OriginXHR.open

    // 重置 XMLHttpRequest
    window.XMLHttpRequest = function () {
      let targetDomList = [] // 存储 ajax 请求，影响到的 dom 元素
      let realXHR = new OriginXHR() // 实例化出一份新的 XMLHttpRequest对象，来进行重载

      realXHR.open = function (method, url, async) {
        Object.keys(window.waitingAjaxMap).forEach(key => {
          let [targetMethod, type, targetUrl] = key.split('::')
          if (!targetUrl) {
            targetUrl = type
          }
          if (targetMethod.toLocaleLowerCase() === method.toLocaleLowerCase() && (url.indexOf(targetUrl) > -1 || new RegExp(targetUrl).test(url))) {
            targetDomList = [...window.waitingAjaxMap[key], ...targetDomList]
            window.waitingAjaxMap[key].forEach(dom => {
              if (dom && dom.type === 'button') { // 如果当前是一个按钮，则使用自带loading效果
                dom.__vue__.vWaiting = true
              } else { // 否则使用 element 的 loading 组件
                dom.ElLoading = ElLoading.service({
                  target: dom,
                  text: dom.getAttribute('element-loading-text'),
                  spinner: dom.getAttribute('element-loading-spinner'),
                  background: dom.getAttribute('element-loading-background'),
                  customClass: dom.getAttribute('element-loading-custom-class'),
                })
              }
              if (!dom.waitingAjaxNum) {
                dom.showStartTime = new Date().getTime() // 该 dom 显示加载中的开始时间
              }
              dom.waitingAjaxNum = dom.waitingAjaxNum || 0 // 不使用 dataset，是应为 dataset 并不实时，在同一个时间内，上一次存储的值不能被保存
              dom.waitingAjaxNum++
            })
          }
        })
        // 使用原生的 XMLHttpRequest open操作
        originOpen.call(realXHR, method, url, async)
      }

      // 监听加载完成，清除 waiting
      realXHR.addEventListener('loadend', () => {
        targetDomList.forEach(dom => {
          dom.waitingAjaxNum--
          if (dom.waitingAjaxNum !== 0) return
          let showEndTime = new Date().getTime() // 该 dom 显示加载中样式的结束时间
          let showTime = showEndTime - dom.showStartTime // 该 dom 显示加载中样式的时长
          let remainShowTime = minMillisecondTimeForShow - showTime // 剩余需要显示加载中样式的时长
          let closeWaiting = () => {
            if (dom && dom.type === 'button') {
              dom.__vue__.vWaiting = false
            } else {
              dom.ElLoading.close()
            }
          }
          remainShowTime > 0 ? setTimeout(closeWaiting, remainShowTime) : closeWaiting() // 是否仍需要额外显示加载中样式，是则设置 setTimeout 延后再取消加载中样式
        })
      }, false)
      return realXHR
    }
  })()

  // 兼容转换传入的 axios 请求函数，转化为 URL 字符串
  /*
  postLogin(body) {
    return api.post('/api/operation/user/login', body)
  }
  则传入 postLogin，会自动解析该函数的配置
  <div v-waiting="userApi.postLogin" @click="test1">兼容传入 axios 请求函数</div>
   */
  function cmptFunStrToUrl(targetList) {
    targetList = Array.isArray(targetList) ? targetList : [targetList] // 兼容转化为数组
    return targetList.map(targetItem => {
      if (typeof targetItem === 'function') { // 如果传入的是函数
        const funStr = targetItem.toString() // 将函数转化为字符串，进行解析
        if (funStr === 'function () { [native code] }') {
          throw new Error(`点击约束，因 Function.prototype.toString 限制，this 被 bind 修改过的函数无法解析, 请显式输入 url 字符串。 ${targetItem.name}，详情可参考 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/toString`)
        }
        const [, method, apiURL] = (funStr.match(/\.(get|post|delete|put|patch)\(['"`]([^'"`]+)/) || [])
        if (!method || !apiURL) {
          throw new Error(`点击约束，传入的函数解析失败, ${targetItem.name}`)
        }
        return `${method}::${apiURL}`
      }
      return targetItem
    })
  }

  v.directive('waiting', {
    bind: (targetDom, binding) => {
      // 添加需要监听的接口，注入对应的 dom
      const targetUrlList = cmptFunStrToUrl(binding.value)
      targetUrlList.forEach(targetUrl => {
        window.waitingAjaxMap[targetUrl] = [targetDom, ...(window.waitingAjaxMap[targetUrl] || [])]
      })
    },

    // 参数变化
    update: (targetDom, binding) => {
      if (binding.oldValue !== binding.value) {
        const preTargetUrlList = cmptFunStrToUrl(binding.oldValue)
        preTargetUrlList.forEach(targetUrl => {
          const index = (window.waitingAjaxMap[targetUrl] || []).indexOf(targetDom)
          index > -1 && window.waitingAjaxMap[targetUrl].splice(index, 1)
        })

        // 添加需要监听的接口，注入对应的 dom
        const targetUrlList = Array.isArray(binding.value) ? binding.value : [binding.value]
        targetUrlList.forEach(targetUrl => {
          window.waitingAjaxMap[targetUrl] = [targetDom, ...(window.waitingAjaxMap[targetUrl] || [])]
        })
      }
    },

    // 指令被卸载，消除消息监听
    unbind: (targetDom, binding) => {
      const targetUrlList = cmptFunStrToUrl(binding.value)
      targetUrlList.forEach(targetUrl => {
        const index = window.waitingAjaxMap[targetUrl].indexOf(targetDom)
        index > -1 && window.waitingAjaxMap[targetUrl].splice(index, 1)
        if (window.waitingAjaxMap[targetUrl].length === 0) {
          delete window.waitingAjaxMap[targetUrl]
        }
      })
    }
  })
}

export default {
  install(Vue) {
    Vue.use(waitingDirective)
  },
}
