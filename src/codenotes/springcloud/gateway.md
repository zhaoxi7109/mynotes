---
# 当前页面内容标题
title: GateWay笔记
# 当前页面图标
icon: write
# 分类
category:
  - SpringCloudGateway
# 标签
tag:
  - SpringCloudGateway
sticky: false
# 是否收藏在博客主题的文章列表中，当填入数字时，数字越大，排名越靠前。
star: false
# 是否将该文章添加至文章列表中
article: true
# 是否将该文章添加至时间线中
timeline: true
---

# gateway

## 4. 网关

### 4.1 Gateway服务网关

- 什么是网关

  网关（Gateway）指的是一个充当系统入口的服务组件，用于处理客户端请求和服务端响应。网关可以接收客户端请求，将请求路由到不同的后端服务，并将服务的响应返回给客户端。

  网关通常具有以下几个特点：

  1. 路由和负载均衡
  2. 安全控制
  3. 协议转换和数据转换
  4. 缓存和限流

- SpringCloud中常见的网关服务包括以下几种：

  1. Zuul
  2. **Spring Cloud Gateway**：Spring Cloud Gateway是Spring Cloud官方推出的网关服务，基于Spring Framework 5、Project Reactor和Spring Boot 2等技术栈。

Zuul是基于Servlet的实现，属于阻塞式编程。而SpringCloudGateway则是基于Spring5中提供的WebFlux，属于响应式编程的实现，具备更好的性能。

### 4.2 基本使用

1. 引入依赖：SpringBoot项目

```xml
<!--网关-->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
```

2. 在application.yml文件中配置路由规则

```yaml
server:
  port: 10010 # 网关端口
spring:
  application:
    name: gateway # 服务名称
  cloud: # 微服务配置，没有使用Nacos就不配置
    nacos:
      server-addr: localhost:8848 # nacos地址
    gateway:
      routes: # 网关路由配置
        - id: user-service # 路由id，自定义，只要唯一即可
          # uri: http://127.0.0.1:8081 # 路由的目标地址 http就是固定地址
          uri: lb://userservice # 路由的目标地址 lb就是负载均衡，后面跟服务名称
          predicates: # 路由断言，也就是判断请求是否符合路由规则的条件
            - Path=/user/** # 这个是按照路径匹配，只要以/user/开头就符合要求
```

我们将符合`Path` 规则的一切请求，都代理到 `uri`参数指定的地址。

3. 重启测试

重启网关，访问http://localhost:10010/user/1时，符合`/user/**`规则的请求能被代理到uri：http://userservice/user/1，

### 4.2 配置

#### 4.2.1 断言工厂

我们在配置文件中写的断言规则只是字符串，这些字符串会被**Predicate Factory**读取并处理，转变为路由判断的条件

例如Path=/user/**是按照路径匹配，这个规则是由

`org.springframework.cloud.gateway.handler.predicate.PathRoutePredicateFactory`类来处理的，常见断言工厂如下

| **名称**   | **说明**                       | **示例**                                                     |
| ---------- | ------------------------------ | ------------------------------------------------------------ |
| After      | 是某个时间点后的请求           | -  After=2037-01-20T17:42:47.789-07:00[America/Denver]       |
| Before     | 是某个时间点之前的请求         | -  Before=2031-04-13T15:14:47.433+08:00[Asia/Shanghai]       |
| Between    | 是某两个时间点之前的请求       | -  Between=2037-01-20T17:42:47.789-07:00[America/Denver],  2037-01-21T17:42:47.789-07:00[America/Denver] |
| Cookie     | 请求必须包含某些cookie         | - Cookie=chocolate, ch.p                                     |
| Header     | 请求必须包含某些header         | - Header=X-Request-Id, \d+                                   |
| Host       | 请求必须是访问某个host（域名） | -  Host=**.somehost.org,**.anotherhost.org                   |
| Method     | 请求方式必须是指定方式         | - Method=GET,POST                                            |
| Path       | 请求路径必须符合指定规则       | - Path=/red/{segment},/blue/**                               |
| Query      | 请求参数必须包含指定参数       | - Query=name, Jack或者-  Query=name                          |
| RemoteAddr | 请求者的ip必须是指定范围       | - RemoteAddr=192.168.1.1/24                                  |
| Weight     | 权重处理                       |                                                              |

#### 4.2.2 过滤器工厂

GatewayFilter是网关中提供的一种过滤器，可以对进入网关的请求和微服务返回的响应做处理：

Spring提供了31种不同的路由过滤器工厂。常见的如下：

| **名称**             | **说明**                     |
| -------------------- | ---------------------------- |
| AddRequestHeader     | 给当前请求添加一个请求头     |
| RemoveRequestHeader  | 移除请求中的一个请求头       |
| AddResponseHeader    | 给响应结果中添加一个响应头   |
| RemoveResponseHeader | 从响应结果中移除有一个响应头 |
| RequestRateLimiter   | 限制请求的流量               |

1. 请求头过滤器AddRequestHeader 

> **需求**：给所有进入userservice的请求添加一个请求头：Truth=itcast is freaking awesome!

```yaml
spring:
  cloud:
    gateway:
      routes:
      - id: user-service 
        uri: lb://userservice 
        predicates: 
        - Path=/user/** 
        filters: # 只对当前路由下的服务起效
        - AddRequestHeader=Truth, Itcast is freaking awesome! # 添加请求头
```

2. 默认过滤器

如果要对所有的路由都生效，则可以将过滤器工厂写到default下。格式如下：

```yaml
spring:
  cloud:
    gateway:
      routes:
      - id: user-service 
        uri: lb://userservice 
        predicates: 
        - Path=/user/**
      default-filters: # 默认过滤项，对所有路由下的服务都起效
      - AddRequestHeader=Truth, Itcast is freaking awesome! 
```

#### 4.2.3 全局过滤器

网关提供了31种配置文件中的过滤器，但每一种过滤器的作用都是固定的，没办法实现自己的逻辑，所以需要使用全局过滤器

全局过滤器作用也是处理一切进入网关的请求和微服务响应，与GatewayFilter的作用一样。区别在于GatewayFilter通过配置定义，处理逻辑是固定的；而GlobalFilter的逻辑需要自己写代码实现。

定义方式是实现GlobalFilter接口。

```java
public interface GlobalFilter {
    /**
     *  处理当前请求，有必要的话通过{@link GatewayFilterChain}将请求交给下一个过滤器处理
     *
     * @param exchange 请求上下文，里面可以获取Request、Response等信息
     * @param chain 用来把请求委托给下一个过滤器 
     * @return {@code Mono<Void>} 返回标示当前过滤器业务结束
     */
    Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain);
}
```

自定义全局过滤器

需求：定义全局过滤器，拦截请求，判断请求的参数是否满足下面条件：

- 参数中是否有authorization，

- authorization参数值是否为admin

如果同时满足则放行，否则拦截

实现：

1. 在gateway中定义一个过滤器：

```java
package cn.zhaoxi.gateway.filters;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Order(-1) //设置过滤器权重，值越低优先级越高
@Component
public class AuthorizeFilter implements GlobalFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // 1.获取请求参数
        MultiValueMap<String, String> params = exchange.getRequest().getQueryParams();
        // 2.获取authorization参数
        String auth = params.getFirst("authorization");
        // 3.校验
        if ("admin".equals(auth)) {
            // 放行
            return chain.filter(exchange);
        }
        // 4.拦截
        // 4.1.禁止访问，设置状态码
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        // 4.2.结束处理
        return exchange.getResponse().setComplete();
    }
}
```

#### 4.2.4 过滤器执行顺序

请求进入网关会碰到三类过滤器：当前路由的过滤器、DefaultFilter、GlobalFilter（前两个为yml文件中，后一个为自定义）

请求路由后，会将当前路由过滤器和DefaultFilter、GlobalFilter，合并到一个过滤器链（集合）中，排序后依次执行每个过滤器：

排序的规则

- 每一个过滤器都必须指定一个int类型的order值，**order值越小，优先级越高，执行顺序越靠前**。
- GlobalFilter通过实现Ordered接口，或者添加@Order注解来指定order值，由我们自己指定
- 路由过滤器和defaultFilter的order由Spring指定，默认是按照声明顺序从1递增。
- 当过滤器的order值一样时，会按照 defaultFilter > 路由过滤器 > GlobalFilter的顺序执行。

### 4.3 跨域

#### 4.3.1 跨域简介

跨域（Cross-Origin）是指在浏览器中，当一个Web页面从一个域名的网页去请求另一个域名的资源时，就会发生跨域。域名或者端口不同都是跨域。文章：https://www.ruanyifeng.com/blog/2016/04/cors.html

解决方案

1. JSONP：利用script标签可以跨域的特性，将需要获取的数据包装在一个回调函数中，然后通过script标签加载这个回调函数。这样，当脚本加载完成后，回调函数会被执行，从而实现跨域获取数据。

2. CORS（跨域资源共享）：CORS是一种新的跨域解决方案，它利用HTTP头部信息来告知浏览器，哪些跨域请求是被允许的。服务器端需要设置Access-Control-Allow-Origin等头部信息，告知浏览器哪些跨域请求是被允许的。

3. 代理：通过在同一域名下的服务器端设置代理，将跨域请求转发到后端服务，并将响应结果返回给前端。这样，前端就可以通过同一域名下的服务器端来间接地访问跨域资源，从而实现跨域访问。

4. WebSocket：WebSocket是一种新的协议，它可以在浏览器和服务器之间建立一条持久化的连接，从而实现跨域通信。WebSocket协议可以通过HTTP升级来建立连接，然后使用自定义的协议进行通信，从而实现实时通信和跨域访问。

5. postMessage：postMessage是HTML5中提供的一种跨域通信的API，它可以在不同窗口或iframe之间传递消息，从而实现跨域通信。通过postMessage，可以在不同域名下的页面之间传递数据，实现跨域访问。


#### 4.3.2 解决方案

在gateway服务的application.yml文件中，添加配置：

```yaml
spring:
  cloud:
    gateway:
      globalcors: # 全局的跨域处理
        add-to-simple-url-handler-mapping: true # 解决options请求被拦截问题
        corsConfigurations:
          '[/**]':
            allowedOrigins: # 允许哪些网站的跨域请求 
              - "http://localhost:8090"
            allowedMethods: # 允许的跨域ajax的请求方式
              - "GET"
              - "POST"
              - "DELETE"
              - "PUT"
              - "OPTIONS"
            allowedHeaders: "*" # 允许在请求中携带的头信息
            allowCredentials: true # 是否允许携带cookie
            maxAge: 360000 # 这次跨域检测的有效期
```

### 4.4网关与消息队列的异同

相同点：

1. 都可以实现异步通信：
2. 都可以实现解耦：
3. 都可以实现负载均衡：

不同点：

1. 功能不同：网关主要用于路由、转发、协议转换等功能，而消息队列主要用于异步消息传递、发布订阅、消息缓存等功能。网关不具备缓存和业务处理。

2. 使用场景不同：网关主要用于处理HTTP请求，将请求路由到不同的后端服务，从而实现微服务架构中的API网关等功能。而消息队列主要用于异步消息传递、发布订阅、消息缓存等场景，例如在分布式系统中实现服务间的消息通信、事件驱动等功能。

3. 数据传输方式不同：网关通常采用同步方式传输数据，即等待后端服务返回结果后再返回客户端，而消息队列通常采用异步方式传输数据，即消息生产者发送消息后不需要等待消费者返回结果，而是立即返回，由消费者异步消费消息。

4. 通信协议不同：网关通常支持多种通信协议，例如HTTP、WebSocket、gRPC等，而消息队列通常使用自定义的消息协议，例如**AMQP**、**MQTT**等。