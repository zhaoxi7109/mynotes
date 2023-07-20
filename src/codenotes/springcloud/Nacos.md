---
# 当前页面内容标题
title: Nacos
# 当前页面图标
icon: write
# 分类
category:
  - SpringCloud
# 标签
tag:
  - Nacos
sticky: false
# 是否收藏在博客主题的文章列表中，当填入数字时，数字越大，排名越靠前。
star: false
# 是否将该文章添加至文章列表中
article: true
# 是否将该文章添加至时间线中
timeline: true
---

## Nacos

### 3.2 Nacos注册中心

Nacos是阿里巴巴在SpringCloudAlibaba中包含的注册中心。官网：https://nacos.io/，Nacos的使用不同于Eureka，Nacos有点类似于Nginx，需要下载来运行，如果没下载直接导包使用会报很多错

#### 3.2.1 安装Nacos

##### 3.2.1.1 Windows安装

1. 下载安装包，开发阶段采用单机安装即可

在Nacos的GitHub页面，提供有下载链接，可以下载编译好的Nacos服务端或者源代码：

GitHub主页：https://github.com/alibaba/nacos

GitHub的Release下载页：https://github.com/alibaba/nacos/releases

windows版本使用`nacos-server-1.4.1.zip`包即可。

2. 解压到任意非中文目录下

- bin：启动脚本
- conf：配置文件

3. 端口配置

Nacos的默认端口是8848，如果你电脑上的其它进程占用了8848端口，需要关闭该进程或者修改端口。

**如果无法关闭占用8848端口的进程**，也可以进入nacos的conf目录，修改配置文件（application.properties）中的端口：

4. 进入bin目录，执行如下windows命令即可启动：

```
startup.cmd -m standalone
```

5. 访问http://127.0.0.1:8848/nacos，默认的账号和密码都是nacos，没报错即成功

##### 3.2.1.2 Linux安装

略

#### 3.2.3 基本使用

1. 在父工程的pom文件中的`<dependencyManagement>`中引入SpringCloudAlibaba的依赖：

```xml
<dependency>
    <!--Nacos管理依赖-->
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-alibaba-dependencies</artifactId>
    <version>2.2.6.RELEASE</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

然后在子工程中中的pom文件中引入nacos-discovery依赖：

```xml
<dependency>
     <!--Nacos服务注册依赖-->
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

同时，Eureka相关依赖的注释掉

2. 在子工程中添加配置

3. ### 配置nacos地址

   在user-service和order-service的application.yml中添加nacos地址：

```yaml
spring:
  cloud:
    nacos:
      server-addr: localhost:8848 #配置Nacos地址
      discovery: #配置集群
        cluster-name: HZ # 集群名称，联系Nacos的多级存储模型
```

#### 3.2.4 同集群优先负载均衡

默认的`ZoneAvoidanceRule`并不能实现根据同集群优先来实现负载均衡。因此Nacos中提供了一个`NacosRule`的实现，可以优先从同集群中挑选实例。

1. 给对应服务添加集群配置：

```sh
spring:
  cloud:
    nacos:
      server-addr: localhost:8848
      discovery:
        cluster-name: HZ # 集群名称
```

2. 修改负载均衡规则

```yaml
userservice:
  ribbon:
    NFLoadBalancerRuleClassName: com.alibaba.cloud.nacos.ribbon.NacosRule #负载均衡规则，实现同集群下的负载均衡
```

#### 3.2.5 权重配置

默认情况下NacosRule是同集群内随机挑选，不会考虑机器的性能问题。所以会导致性能快的机器没有充分利用，性能慢的机器又会有堆积，因此，Nacos提供了权重配置来控制访问频率，权重越大则访问频率越高。

可在对应服务点击详情，编辑进行设置，数值越大权重越大，如果权重修改为0，则该实例永远不会被访问

#### 3.2.6 环境隔离

1. Nacos提供了namespace（命名空间）来实现环境隔离功能。
   - nacos中可以有多个namespace
   - namespace下可以有group、service等
   - 不同namespace之间相互隔离，例如不同namespace的服务互相不可见

2. 创建namespace

- 默认情况下，所有service、data、group都在同一个namespace，名为public（保留空间）

- 我们可以自己添加namespace然后在配置文件中将服务添加到指定命名空间中

- 给微服务配置namespace只能通过修改配置来实现

```yaml
spring:
  cloud:
    nacos:
      server-addr: localhost:8848
      discovery:
        cluster-name: HZ #配置集群
        namespace: 492a7d5d-237b-46a1-a99a-fa8e98e4b0f9 # 命名空间，填ID
```

不同环境，即namespace下的服务是不可见的，即不能从一个环境的服务访问另一个环境的服务，控制台会报错：

#### 3.2.7 Nacos与Eureka的区别

Nacos的服务实例分为两种类型：

- 临时实例：如果实例宕机超过一定时间，会从服务列表剔除，默认的类型。

- 非临时实例：如果实例宕机，不会从服务列表剔除，也可以叫永久实例。

配置一个服务实例为永久实例如下

```yaml
spring:
  cloud:
    nacos:
      discovery:
        ephemeral: false # 设置为非临时实例
```

Nacos和Eureka整体结构类似，服务注册、服务拉取、心跳等待，但是也存在一些差异

- Nacos与eureka的共同点
  - 都支持服务注册和服务拉取
  - 都支持服务提供者心跳方式做健康检测

- Nacos与Eureka的区别
  - Nacos支持服务端主动检测提供者状态：临时实例采用心跳模式，非临时实例采用主动检测模式
  - 临时实例心跳不正常会被剔除，非临时实例则不会被剔除
  - Nacos支持服务列表变更的消息推送模式，服务列表更新更及时
  - Nacos集群默认采用AP方式，当集群中存在非临时实例时，采用CP模式；Eureka采用AP方式

（ACP模式详见另外章节）

#### 3.2.8 配置管理

Nacos除了可以做注册中心，还可以做配置中心来使用。

配置中心就是将多个微服务的主要配置统一到一个平台上（Nacos）来集中管理，简单理解就是对项目的针对性提纯，原本项目结构复杂，我们将配置文件单独拎出来放到一起（同样类比于目录与正文的关系，就可以很清晰知道其好处）。

使用配置中心(Nacos)的另一个好处就是**配置的热更新**，就是在配置中心更改后原服务并不用重启就能生效，这一点尤为重要，因为每次项目重启都是一次耗时费力的过程（尤其是资源占有率大的项目）

并不是在配置中心配置了就能热更新了，具体参照配置热更新一小节

##### 3.2.8.1 在nacos添加配置

在nacos中选择``配置管理``，然后新增

- DataID : 即为配置文件的id， 格式为： [服务名称]-[profile].[后缀名]
- Group：默认
- 描述：自己写
- 配置格式：目前支持yaml与properties ， 通常都用yaml格式

注意：项目的核心配置，需要热更新的配置才有放到nacos管理的必要。基本不会变更的一些配置还是保存在微服务本地比较好。

##### 3.2.8.2 从Nacos拉取配置

微服务需要拉取nacos中管理的配置与本地的application.yml配置合并，才能完成项目启动。也就是说在application.yml文件还未被读取时就得先知道nacos得地址，因此spring引入了一种新的配置文件：**bootstrap.yaml**文件，会在application.yml之前被读取。

大致流程：项目启动 - 加载bootstrap.yaml文件 - 获取nacos中配置文件 - 读取application.yml文件 - 创建Spring容器 - 加载Bean

实现步骤：

1. 在需要受配置中心管理配置得服务中引入nacos-config依赖

```xml
<!--nacos配置管理依赖-->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

2. 添加bootstrap.yaml

```yaml
spring:
  application:
    name: userservice # 服务名称
  profiles:
    active: dev #开发环境，这里是dev 
  cloud:
    nacos:
      server-addr: localhost:8848 # Nacos地址
      config:
        file-extension: yaml # 文件后缀名
```

这里会根据spring.cloud.nacos.server-addr获取nacos地址，再根据

`${spring.application.name}-${spring.profiles.active}.${spring.cloud.nacos.config.file-extension}`作为文件id，来读取配置。（所以这就是之前说明id要求的原因）,如上的配置文件，对应**DataId**为**userservice-dev.yaml**

3. 使用@Value注入nacos配置

```java
@Slf4j
@RestController
@RequestMapping("/user")
@RefreshScope //开启热更新
public class UserController {

    @Autowired
    private UserService userService;

    @Value("${pattern.dateformat}")//注入Nacos中的配置
    private String dateformat;
    
    @GetMapping("now")
    public String now(){
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern(dateformat));
    }
}
```

##### 3.2.8.3 配置热更新

并不是将配置放到Nacos就能热更新，要实现**配置热更新**还需要满足以下条件。

- 方式一：在@Value注入的变量所在类上添加注解@RefreshScope：

```java
@Slf4j
@RestController
@RequestMapping("/user")
@RefreshScope //开启热更新
public class UserController {

    @Autowired
    private UserService userService;

    @Value("${pattern.dateformat}")//注入Nacos中的配置
    private String dateformat;
    
    @GetMapping("now")
    public String now(){
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern(dateformat));
    }
}
```

- 方式二:使用@ConfigurationProperties注解代替@Value注解。

```java
@Component
@Data
@ConfigurationProperties(prefix = "pattern")
public class PatternProperties { //定义一个类与配置文件中 pattern映射
    private String dateformat; //类属性为 pattern的下级元素
}
```

在UserController中使用这个类代替@Value：

```java
@Slf4j
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PatternProperties patternProperties;//使用类注入代替@Value属性注入

    @GetMapping("now")
    public String now(){
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern(patternProperties.getDateformat()));
    }
}
```

#### 3.2.9 配置共享

在微服务启动时，会去nacos读取多个配置文件，例如：

- `[spring.application.name]-[spring.profiles.active].yaml`，例如：userservice-dev.yaml

- `[spring.application.name].yaml`，例如：userservice.yaml

而`[spring.application.name].yaml`不包含环境，因此可以被多个环境共享。

所以要在Nacos中添加一个多环境的配置只需要在设置DataID时不指定环境就行，如：userservice.yaml

- 配置共享的优先级

服务名-frofile.yaml > 服务名.yaml > 本地配置

- 搭建Nacos集群

Nacos生产环境下一定要部署为集群状态（参照同集群优先负载均衡）