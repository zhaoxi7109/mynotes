---
# 当前页面内容标题
title: SpringBoot笔记
# 当前页面图标
icon: write
# 分类
category:
  - SpringBoot
# 标签
tag:
  - SpringBoot
sticky: false
# 是否收藏在博客主题的文章列表中，当填入数字时，数字越大，排名越靠前。
star: false
# 是否将该文章添加至文章列表中
article: true
# 是否将该文章添加至时间线中
timeline: true
---

#  SpringBoot

## 1. 入门

### 1.1 项目创建

- 官网创建：https://start.spring.io

- idea创建
- 阿里云创建：https://start.aliyun.com/

- 手工创建：创建普通的Maven项目，导入相关依赖


spring-boot-starter是SpringBoot项目最基础的依赖，有这个依赖就是SpringBoot项目

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
</dependency>
```

```xml
//spring-boot-starter-test 整合测试用的
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

```java
@SpringBootApplication  //启动类、引导类
public class SpringBootConfigurationApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext configurableApplicationContext = SpringApplication.run(SpringBootConfigurationApplication.class, args);
        //args中存储的是临时属性
    }
}
```

Rest风格

REST是一种Web应用程序架构风格，它基于HTTP协议，通过使用统一资源标识符（URI）和HTTP动词（GET，POST，PUT，DELETE等）来实现客户端和服务器之间的通信。

REST风格的API通常使用JSON或XML格式来传输数据

- Restful

- Rest和Restful的区别

  REST是一种架构风格，而RESTful是符合REST架构风格的Web服务。

### 1.2 配置文件

- 类型

  - application.properties
  - application.yml
  - application.yaml
- 优先级

  - properties - yml -yaml

### 1.3 yml文件

```yml
user:
  age: 14
  name: zs
  subject:
    - java
    - python
```

以上结构类似于以下

```json
{
   "user":{
       "age":14, 
       "name":"zs",
       "subject":["java", "python"]
          }
}
```

#### 1.3.1 yml文件概括

YAML（Yet Another Markup Language）是一种轻量级的数据序列化格式，yml文件是一种遵循YAML语法规则的文件，通常用于配置文件、数据序列化和交换等应用场景。

语法规则

1. 大小写敏感：YAML是大小写敏感的
2. 使用缩进表示层次结构：YAML使用缩进来表示层次结构，每个缩进为2个空格。子项比父项缩进2个空格。
3. 使用冒号分隔键和值：键和值之间使用冒号“:”分隔，冒号后面必须有一个空格。
4. 使用短横线表示列表项：列表项使用短横线“-”表示，每个短横线后面必须有一个空格。
5. 字符串表示：YAML中的字符串可以使用单引号、双引号或无引号表示。当字符串中包含特殊字符时，必须使用引号。
6. 注释：注释使用井号“#”表示，从该符号开始到行末为注释，不会被解析。
   7.数值可以是2进制，8进制，10进制，16进制，所以如果数值比较特殊时最好用引号，不然可能会识别成其它进制。
   8.使用 ~ 表示null。
   示例如下：

```yml
# 注释
name: John
age: 25
address:
  city: Beijing
  street: Chaoyang Road
hobbies:
  - reading
  - music
  
```

该YAML文件表示一个包含三个键值对和一个列表的数据结构，其中address是一个嵌套的键值对，表示一个包含城市和街道信息的地址，hobbies是一个包含两个元素的列表，表示John的爱好是阅读和音乐。

#### 1.3.2 获取yml文件中的值

- 取值一，通过@Value将值注入类中属性

  ```java
  @Value("${user.age}")
  private Integer age;
  ```

- 取值二，借助Environment对象

  ```java
  //Environment对象中存储了yml配置文件中所有值
  @Autowired//自动装配获取environment对象
  private Environment environment;
  public void get(){
    environment.getProperty("user.age")//获取具体值  
  }
  ```

- 取值三，创建类并通过注解映射yml文件中对应值

将yml文件中值以对象形式使用，

```java
@Component //设置为Bean，受Spring管理
//关联到yml文件中对应值
@ConfigurationProperties(prefix = "user") //这个注解比较重要，自动让属性与yml文件中user对应
public class User {
    private String name;//对应yml文件中user.name
    private Integer age;//对应yml文件中user.age
```

```java
@Autowired
private User user;//yml文件中的值被转为对象形式使用
```

都可以用于第三方Bean的属性值设置，一般一二种居多
注：@ConfigurationProperties注解可能会出现未配置SpringBoot配置注解处理器，  此时需要导包，重启

```xml
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-configuration-processor</artifactId>
<optional>true</optional>
```

## 2. 整合

### 2.1 整合JUnit

单元测试

### 2.2 整合Mybatis

1. 导依赖

可以在创建SpringBoot工程时勾选**Mysql Driver** 和 **Mybatis Framework**，也可以之后手动导入相关依赖

Mysql Driver是与MySQL相关的依赖

```xml

```

2. 配置

```yml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/mp
    username: root
    password: 123456
//指明 druid，没有使用druid则不写
    type: com.alibaba.druid.pool.DruidDataSource
     #注：mysql8及以上的可能需要设置服务器时区 ?serverTimezone=UTC
    #这里只是配置mysql，mybatis没有配置
```

```java
//dao层
@Mapper
public interface BookDao {
    @Select("select * from user where id = #{id}")
    public Book bookById(Integer id);
}
```

### 2.3 整合Mybatis-plus

官网：https://baomidou.com/

1. 添加依赖

Spring官方并没有收录MP ，所以无法通过直接勾选的方式导入依赖， 之前可以选择通过阿里云地址创建SpringBoot项目勾选MP，但现在阿里云似乎没有

创建时只勾选Mysql Driver ，Mybatis-plus依赖 手工导入

```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.3.1</version>
</dependency>
<!-- 数据库连接池-->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid</artifactId>
    <version>1.2.8</version>
</dependency>
<!-- 如果勾选了Mysql Driver就不用再次导入-->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.28</version>
```

mybatis-plus-boot-starter  依赖中包含了 spring-boot-starter  所以后者可以删除

依赖版本不匹配会导致自动装配报错

2. 配置在application中配置数据库连接信息

```yml
#配置MySQL
spring:
  datasource: #数据库连接池的配置
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/mp
    username: root
    password: 123456
mybatis-plus: #mybatis-plus的配置，与Spring同级别
  global-config:
    db-config:
      table-prefix: _b #配置匹配数据库的表名是以 _b 开头
      id-type: auto #配置id为自增长
  configuration:
    #配置日志输出到控制台
    log-impl:  org.apache.ibatis.logging.stdout.StdOutImpl
```

注：数据库id自增默认按照UUID雪花算法生成long类型的id，是随机的，id-type: auto 设置id根据数据库表id自增，同时数据库表的id也要设置为自增长，不然会报错**Error updating database. Cause: java.sql.SQLException: Field 'id' doesn't have a default value**

3. 关联表名

mybatis 默认会以实体类的名字作为表名，所以当表名与实体类名不一致时会报错**java.sql.SQLSyntaxErrorException: Table 'mp.book' doesn't exist**

```java
@TableName("books")  //添加在实体类上，为实体类指明对应的表名
public class Book{}
```

4. 编写Dao层

```java
//dao层，去操作数据库
@Mapper
public interface UserDao extends BaseMapper<User> {
//继承BaseMapper类
}
```

5. 分页功能的实现

```java
@Test
public void testUserDao(){
    IPage page = new Page(1L,3L);
    userDao.selectPage(page,null);
}
```

分页功能需要配置拦截器

```java
@Configuration//定义成配置Bean
public class mpConfig {
    @Bean
    public MybatisPlusInterceptor mpInterceptor(){
        //创建拦截器容器
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        //添加分页相关的拦截器
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        return interceptor;
    }
}
```

进行条件查询（Wrapper条件对象）

```java
public void testUserDao(){
  IPage page1 = new Page(1,3);
  QueryWrapper<User> wrapper = new QueryWrapper<>();//条件对象
  wrapper.like("name","zs");
  userDao.selectPage(page1, wrapper);
    //Lambda查询对象
  LambdaQueryWrapper<Book> lambdaQueryWrapper = new LambdaQueryWrapper<Book>();
  lambdaQueryWrapper.like(Book::getName,"j");
  queryWrapper.like("name","j");
  bookDao.selectList(queryWrapper);
}

```

### 2.4 整合druid

1. 导依赖

```xml
<!-- https://mvnrepository.com/artifact/com.alibaba/druid-spring-boot-starter -->
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>druid-spring-boot-starter</artifactId>
  <version>1.2.15</version>
</dependency>
```

spring中没有druid，手动导入，不是druid  而是 Druid Spring Boot Starter

2. 配置

配置方法一：

```yml
#配置MySQL
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/mp
    username: root
    password: 123456
    type: com.alibaba.druid.pool.DruidDataSource #指明连接池
```

配置方法二·：

```yml
#配置MySQL
spring:
  datasource:
    druid:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/mp
      username: root
      password: 123456
```

方法二可能会报错 **IllegalStateException**

## 3. 项目结构

### 3.1 三层架构

三层架构是一种常见的软件架构模式，它将应用程序划分为三个主要部分：表示层、业务逻辑层和数据访问层。每个层次都有其独特的责任，可以独立开发、测试和维护，同时也能够相互协作，共同完成应用程序的功能。

下面是三层架构的各个层次及其职责：

1. 表示层

表示层是应用程序的用户界面，它负责与用户进行交互，并将用户的请求发送到业务逻辑层。表示层通常包括以下组件：

- 用户界面：包括Web界面、移动应用程序界面等，用于与用户进行交互。

- 控制器：负责接收和处理用户请求，将请求转发给业务逻辑层。

- 视图：负责显示数据和结果，通常是HTML页面、移动应用程序界面等。

表示层的主要职责是将用户请求转发给业务逻辑层，并将业务逻辑层的结果呈现给用户。

2. 业务逻辑层

业务逻辑层是应用程序的核心部分，它负责处理业务逻辑和数据处理。业务逻辑层通常包括以下组件：

- 业务逻辑：负责处理业务逻辑，包括计算、验证、控制和处理数据等。

- 服务：提供业务逻辑的服务，通常是Java类或C#类。

- 数据访问对象（DAO）：封装数据访问逻辑，负责与数据访问层进行交互。

业务逻辑层的主要职责是处理业务逻辑和数据处理，以及与数据访问层进行交互。

3. 数据访问层

数据访问层是应用程序与数据库之间的接口，它负责与数据库进行交互，执行数据访问操作。数据访问层通常包括以下组件：

- 数据库：存储数据的地方。

- 数据访问对象（DAO）：封装数据访问逻辑，负责与业务逻辑层进行交互。

- ORM框架：用于将数据库表映射到Java或C#对象，提供面向对象的数据访问接口。

数据访问层的主要职责是与数据库进行交互，并执行数据访问操作。

controller web层、表现层

```java
//web层 mvc中的c，接收前端请求
@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;
    @GetMapping("/{id}")
    public String selectAll(@PathVariable int id,int id1){
        userService.save(new User());//调用业务层
        return "users all";//响应前端数据
    }
}
```

service层 业务层

```java
@Service//定义成Bean
public class UserServiceImpl implements UserService{
    @Autowired
    private UserDao userDao;//获取数据层对象
    @Override
    public boolean save(User user) {
        //当增加操作时调用对应的数据层方法
        return userDao.insert(user)>0;
    }
}

//使用MP的Service接口
public interface mpUserService extends IService<User> {
    //IService中自带了大量通用方法,操作数据库
}

//使用MP的Service实现类
@Service
public class mpUserServiceImpl extends ServiceImpl<UserDao, User> implements mpUserService{
}
```

dao层 数据层

```java
//dao层，去操作数据库
@Mapper
public interface UserDao {
    @Select("select * from user where id = #{id}")
     List<User> selectById (int id);
}
  //dao层，去操作数据库,使用MP
  @Mapper
  public interface UserDao extends BaseMapper<User> {
      //接口继承了BaseMapper类提供许多有关增删改查的方法，故不用手动写sql方法了
  }
```

### 3.2 前后端数据协议

自定义的统一的返回对象，规范后端向前端相应的数据的格式，便于使用

```java
@Data
public class R {
    private Boolean flag = true;
    private Object data;
    public R(){}
    public R(Boolean flag){
        this.flag = flag;
    }
    public R(Boolean flag,Object data){
        this.flag = flag;
        this.data = data;
    }
}
```

## 4. 运维相关

### 4.1 打包

Maven生命周期，先clean再package，跳过测试：打包时会默认执行测试文件中程序查询，所以一般要跳过测试 。打包完成后target目录中会生成一个jar包。运行jar包：可以在cmd中通过 java -jar jar包名 运行该jar包

### 4.2 windows端口指令

查询正在用的所有端口

```
netstat -ano
```

查询指定端口

```
netstat -ano | findstr "80"
信息中包含80的都查，不是指80端口
```

根据进程PID查询进程

```
- tasklist | findstr "进程PID"
- tasklist | findstr "9480"
```

根据PID杀死任务

```
- taskkill /F / "进程PID"
- taskkill -f -pid "9480"
```

根据进程名称杀死任务

```
taskkill -f -t -im "进程名称"
```

### 4.3 临时属性

- 使用java -jar命令时用 --server.port 设置临时端口为8080

```
java -jar SpringBoot_ssmp-0.0.1-SNAPSHOT.jar --server.port=8080
java -jar SpringBoot_ssmp-0.0.1-SNAPSHOT.jar --server.port=8080 --新配置命令
```

### 4.4 配置

- 4级配置文件

  - 1级 file：config/application.yml
  - 2级 file：application.yml
  - 3级calsspath：config/application.yml
  - 4级 classpath：application.yml

- 多环境配置文件

  ```yml
  #应用环境
  spring:
    profiles: active
  ---
    #生产环境
  spring:
    profiles: pro
  server:
    port: 8080 #指定服务的运行端口
  --- #通过短线分隔不同的环境
  
  #开发环境
  spring:
    profiles: dev
  server:
    port: 8081
  ---
  
  #测试环境
  spring:
    profiles: test
  server:
    port: 8082
  ```

### 4.5 热部署

#### 4.5.1 概念

热部署（Hot Deployment）指的是在运行状态下，不需要停止应用程序就能够更新应用程序的部分或全部内容。热部署可以提高应用程序的可用性和可维护性，避免了因为停止应用程序而导致的停机时间。在Java应用程序中，热部署可以通过以下方式实现：

1. 使用JRebel工具：JRebel是一个Java开发工具，可以实现Java应用程序的热部署。它通过在运行时动态地加载新的类文件，不需要重新启动应用程序就可以更新应用程序的代码和配置。
2. 使用Spring Boot DevTools：Spring Boot DevTools是一个开发工具，可以实现Spring Boot应用程序的热部署。它可以监控应用程序的代码和资源文件的变化，当检测到变化时，自动重启应用程序。
3. 使用OSGI框架：OSGI是一个Java模块化框架，可以实现Java应用程序的热部署。它通过将应用程序划分为多个模块，每个模块可以独立地更新和部署，不需要重新启动整个应用程序。
4. 使用Java Agent：Java Agent是一个Java运行时工具，可以在运行时修改Java应用程序的字节码，实现热部署。它可以通过Java Instrumentation API来实现。
   Spring Boot DevTools可以在创建项目时勾选

#### 4.5.2 使用Spring Boot DevTools实现热部署

1. 导包，也可以创建时勾选对应

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
</dependency>
```

2. idea工具中找到  **构建->构建项目** 就能刷新项目，但每次都需要手动点击

3. 开启自动构建

在idea中找到 设置->构建，执行，部署->编译器->自动部署项目

使用快捷键 ctrl+shift+alt+/  进入注册表，勾选compiler.automake.allow.when.app.running

4. 范围配置

```yml
#设置static文件夹下的都不参与热部署
spring:      
  devtools:
    restart:
      exclude: static/**
```

有些文件默认不参与热部署，例如静态资源

### 4.6 属性绑定

```java
@Data
@Component
@ConfigurationProperties(prefix="servers") //使用这个注解建立属性与yml文件中配置值的连接
public class ServerConfig {
    private String ipAddress;
    private int port;
    private long timeout;
}
```

```java
@SpringBootApplication
@EnableConfigurationProperties({ServerConfig.class}) //注册为将指定类注册为Bean，
public class SpringBootConfigurationApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext configurableApplicationContext = SpringApplication.run(SpringBootConfigurationApplication.class, args);
    }
}
```

@EnableConfigurationProperties 注解只是让对应类为Bean，不用再添加@Component，并没有匹配yml文件值和对应类属性

### 4.7 宽松绑定

```java
@Data
@Component
@ConfigurationProperties(prefix="servers")
public class ServerConfig {
    private String ipAddress;
    private int port;
    private long timeout;
}
```

@ConfigurationProperties(prefix="servers") 中匹配yml文件中的属性时会忽略yml文件中属性的大小写，中划线，下划线，所以该注解是一个宽松注解

```yml
servers:
# IDADDRESS: 192.168.0.1
# id-address: 192.168.0.1
# id_address: 192.168.0.1
  idAddress: 192.168.0.1
  port: 8080
  timeout: -1
```

以上这几种形式都可以匹配到idaddress

### 4.8 几门技术

#### 4.8.1 新时间单位

Duration

```java
@DurationUnit(ChronoUnit.HOURS)//设置时间单位为H，默认为ms
private Duration serverTimeOut;
```

#### 4.8.2 新存储单位

DataSize

```java
@DataSizeUnit(DataUnit.BYTES)  // 默认是B
private DataSize dataSize;
```

#### 4.8.3 Validation

Validation是一种用于验证数据的框架，它可以帮助开发人员在应用程序中轻松地实现输入数据的验证。Validation框架可以对数据进行各种检查，例如数据格式、数据类型、数据长度、数据范围等，从而确保数据的有效性和完整性。

以下是一个使用Validation框架进行数据验证的简单案例，它演示了如何使用Validation框架来验证用户的输入数据。

1. 创建一个Java Web项目，添加Validation和Spring MVC的依赖。

```xml
<!-- https://mvnrepository.com/artifact/javax.validation/validation-api -->
<dependency>
  <groupId>javax.validation</groupId>
  <artifactId>validation-api</artifactId>
  <version>2.0.1.Final</version>
</dependency>
```

2. 编写User类

User类包括用户的姓名、年龄和电子邮件等属性，并使用Validation注解来定义各个属性的验证规则，如下所示：

```java
@Validated  //开启校验
public class User {

    @NotBlank(message = "姓名不能为空")
    private String name;

    @NotNull(message = "年龄不能为空")
    @Min(value = 18, message = "年龄不能小于18岁")
    private Integer age;

    @Email(message = "电子邮件格式不正确")
    private String email;

    // getter和setter方法
}
```

在上面的代码中，@NotBlank注解表示姓名不能为空，@NotNull和@Min注解表示年龄不能为空且年龄必须大于等于18岁，@Email注解表示电子邮件的格式必须正确。

3. 编写Controller

接下来，我们需要编写一个Controller类来处理用户的输入数据，并使用Validation框架来进行数据验证，如下所示：

```java
@Controller
public class UserController {

    @RequestMapping("/saveUser")
    public String saveUser(@Valid User user, BindingResult result) {
        if (result.hasErrors()) {
            return "errorPage";
        }
        // 处理用户数据
        return "successPage";
    }
}
```

在上面的代码中，**@Valid**注解表示对用户输入的数据进行验证，BindingResult参数用于接收验证结果，如果有错误，则跳转到errorPage页面，否则处理用户数据并跳转到successPage页面。

#### 4.8.4 Hibernate

##### 4.8.4.1 概括

Hibernate是一个Java持久化框架，它提供了一种对象/关系映射（ORM）的方式，将Java对象映射到关系型数据库中的表结构，从而使得Java开发人员可以更加方便地进行数据库操作。

Hibernate的主要作用包括：

1. 简化数据库访问

Hibernate提供了一个面向对象的数据访问接口，使得开发人员可以使用对象的方式来访问数据库，而不必关心底层的数据库操作细节。开发人员可以使用Hibernate提供的API来执行查询、插入、更新和删除等操作，从而简化了数据库访问的流程。

2. 提高代码的可维护性和可重用性

Hibernate提供了一种将Java对象映射到数据库表的方式，使得开发人员可以使用面向对象的方式来设计和实现数据模型。这种方式使得代码更加清晰、易于维护和重用，同时也使得开发人员更加专注于业务逻辑的实现。

3. 提高应用程序性能

Hibernate使用缓存技术来提高应用程序的性能。它可以缓存查询结果、对象等，从而减少了与数据库的交互次数，提高了应用程序的响应速度。

4. 支持多种数据库

Hibernate支持多种数据库，包括Oracle、MySQL、SQL Server、DB2等，使得开发人员可以更加灵活地选择数据库。

##### 4.8.4.2 基本使用

以下是一个使用Hibernate的简单案例，它演示了如何使用Hibernate实现对数据库的增删改查操作。

1. 添加Hibernate和MySQL的依赖

```xml
<!-- https://mvnrepository.com/artifact/org.hibernate.validator/hibernate-validator -->
<dependency>
  <groupId>org.hibernate.validator</groupId>
  <artifactId>hibernate-validator</artifactId>
  <version>8.0.0.Final</version>
</dependency>
```

2. 在项目中创建一个Hibernate配置文件，配置数据库连接信息和Hibernate的一些基本参数

```yml
# 数据库配置
spring:
  datasource: #数据源配置项，包括URL、用户名、密码和JDBC驱动类名
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: mypassword
    driver-class-name: com.mysql.cj.jdbc.Driver

# Hibernate配置
spring:
  jpa:
    hibernate:
      dialect: org.hibernate.dialect.MySQL8Dialect #表示Hibernate方言配置项，指定所使用的数据库方言
      ddl-auto: update #自动建表配置项，指定Hibernate在启动时是否自动创建数据库表结构
      naming: #表示命名策略配置项，指定Hibernate在处理实体类和数据库表名之间的映射时所使用的策略
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
    show-sql: true
    properties:
      hibernate: 
        format_sql: true # 表示是否在控制台上打印Hibernate执行的SQL语句
        use_sql_comments: true # 示是否在Hibernate生成的SQL语句中包含注释。
        generate_statistics: true #表示是否开启Hibernate的统计信息记录


```

在这个示例配置文件中，使用了Spring Boot中的Spring Data JPA来简化Hibernate的配置

2. 实体类

```java
@Entity  //表明为实体类
@Table(name = "user") //建立与对应表的映射
public class User {

    @Id //指定主键
    @GeneratedValue(strategy = GenerationType.IDENTITY) //指定自增策略
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "age")
    private Integer age;

    @Column(name = "email")
    private String email;

    // getter和setter方法
}
```

3. 编写DAO类

接下来，我们需要创建一个DAO类来实现对用户的增删改查操作。UserDAO类应该使用**EntityManager**来进行数据库操作，如下所示：

```java
@Repository
public class UserDAO {

    @PersistenceContext
    private EntityManager entityManager;

    public User findById(Long id) {
        return entityManager.find(User.class, id);
    }

    public void save(User user) {
        entityManager.persist(user);
    }

    public void update(User user) {
        entityManager.merge(user);
    }

    public void deleteById(Long id) {
        User user = entityManager.find(User.class, id);
        entityManager.remove(user);
    }

    public List<User> findAll() {
        CriteriaBuilder builder = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> criteria = builder.createQuery(User.class);
        Root<User> root = criteria.from(User.class);
        criteria.select(root);
        return entityManager.createQuery(criteria).getResultList();
    }
}
```

4. 测试代码

最后，我们需要编写一些测试代码来测试我们的DAO类是否正常工作。例如，我们可以使用JUnit编写一些测试方法：

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class UserDAOTest {

    @Autowired
    private UserDAO userDAO;

    @Test
    public void testSave() {
        User user = new User();
        user.setName("张三");
        user.setAge(20);
        user.setEmail("zhangsan@example.com");
        userDAO.save(user);
        assertNotNull(user.getId());
    }

    @Test
    public void testUpdate() {
        User user = new User();
        user.setName("李四");
        user.setAge(25);
        user.setEmail("lisi@example.com");
        userDAO.save(user);

        user.setName("王五");
        userDAO.update(user);

        User updatedUser = userDAO.findById(user.getId());
        assertEquals("王五", updatedUser.getName());
    }

    @Test
    public void testDelete() {
        User user = new User();
        user.setName("赵六");
        user.setAge(30);
        user.setEmail("zhaoliu@example.com");
        userDAO.save(user);

        Long id = user.getId();
        userDAO.deleteById(id);

        User deletedUser = userDAO.findById(id);
        assertNull(deletedUser);
    }

    @Test
    public void testFindAll() {
        User user1 = new User();
        user1.setName("张三");
        user1.setAge(20);
        user1.setEmail("zhangsan@example.com");
        userDAO.save(user1);

        User user2 = new User();
        user2.setName("李四");
        user2.setAge(25);
        user2.setEmail("lisi@example.com");
        userDAO.save(user2);

        List<User> userList = userDAO.findAll();
        assertEquals(2, userList.size());
    }
}
```

### 4.9 测试

设置临时属性

```java
@SpringBootTest(properties = {"test.prop=testValue"})//设置临时属性
class SpringBootConfigurationApplicationTests {
    @Value("${test.prop}")//使用临时属性
    private String test;
@Test
void contextLoads() {
    System.out.println(test);
}
```

}

@SpringBootTest(properties = {"test.prop=testValue"})

@SpringBootTest(args = {"test.prop=testValue"})，类似于在命令行中添加临时属性，所以优先级高于properties，优先级高于yml中属性

## 5. 数据层解决方案

### 5.1 SQL

关系型数据库遵循ACID规则，事务在英文中是transaction，和现实世界中的交易很类似，它有如下四个特性：

1. (Atomicity) 原子性

原子性很容易理解，也就是说事务里的所有操作要么全部做完，要么都不做，事务成功的条件是事务里的所有操作都成功，只要有一个操作失败，整个事务就失败，需要回滚。
比如银行转账，从A账户转100元至B账户，分为两个步骤：1）从A账户取100元；2）存入100元至B账户。这两步要么一起完成，要么一起不完成，如果只完成第一步，第二步失败，钱会莫名其妙少了100元。

2. C (Consistency) 一致性

一致性也比较容易理解，也就是说数据库要一直处于一致的状态，事务的运行不会改变数据库原本的一致性约束。
例如现有完整性约束a+b=10，如果一个事务改变了a，那么必须得改变b，使得事务结束后依然满足a+b=10，否则事务失败。

3. (Isolation) 独立性

所谓的独立性是指并发的事务之间不会互相影响，如果一个事务要访问的数据正在被另外一个事务修改，只要另外一个事务未提交，它所访问的数据就不受未提交事务的影响。

比如现在有个交易是从A账户转100元至B账户，在这个交易还未完成的情况下，如果此时B查询自己的账户，是看不到新增加的100元的。

4. D (Durability) 持久性

持久性是指一旦事务提交后，它所做的修改将会永久的保存在数据库上，即使出现宕机也不会丢失。

### 5.2 数据源配置

数据源是应用程序连接到数据库的接口，它提供了与数据库进行连接、数据读写等操作的能力。在软件系统中，数据源通常是一个逻辑概念，它可以对应于一个数据库的实例、一个数据库集群或者一个数据文件等。数据源包含了连接到数据库所需的属性和配置信息，例如数据库的地址、用户名、密码、连接池大小等。

在Java应用程序中，数据源通常由JDBC驱动程序提供。Java应用程序通过JDBC API来连接到数据源，并执行SQL语句来读写数据。在Java EE应用程序中，也可以使用**Java Persistence API **（JPA）来操作数据库，JPA也提供了类似于JDBC的接口来连接到数据源。

在Spring框架中，数据源是通过DataSource接口来实现的。Spring中提供了多个数据源的实现，例如基于Apache Commons DBCP的BasicDataSource、基于Tomcat JDBC Pool的TomcatDataSource等。Spring Boot中默认使用**HikariCP**作为数据源，**HikariCP**是一个高性能的JDBC连接池。

数据源是应用程序中与数据库交互的核心组件之一，它的性能和稳定性对应用程序的性能和稳定性有很大的影响。因此，在开发应用程序时，需要根据实际情况选择合适的数据源，并进行适当的配置和优化。

- Hikari

  ```yml
  spring:
    datasource:
      url: jdbc:h2:~/test
      hikari:
        driver-class-name: org.h2.Driver
        username: sa
        password: 123456
  ```

  

- Druid

### 5.3 持久化技术

持久化技术是指将数据保存到持久化存储介质中，以便在应用程序退出后仍然可以保持数据的完整性和可用性。在Java应用程序中，常见的持久化技术有以下几种：

1. JDBC：JDBC是Java数据库连接API的缩写，它是Java应用程序中与关系型数据库交互的标准API。通过JDBC，应用程序可以使用SQL语句来操作数据库，例如查询、插入、更新和删除数据。
2. JPA：JPA是Java Persistence API的缩写，它是一种ORM（对象关系映射）框架，可以将Java对象映射到关系型数据库中的表格中。JPA提供了一套标准的API，可以在不同的ORM框架之间进行切换，例如Hibernate、EclipseLink等。
3. **Hibernate**：Hibernate是一种流行的ORM框架，它可以将Java对象映射到关系型数据库中的表格中。Hibernate提供了丰富的查询语言和缓存机制，可以有效地提高应用程序的性能。
4. **MyBatis**：MyBatis是一种基于XML的持久化框架，它可以将SQL语句映射到Java方法中，并提供了丰富的查询语言和缓存机制。MyBatis与Hibernate相比，更加灵活和轻量级。
5. **Spring Data**：Spring Data是一个为Java应用程序提供数据访问技术的框架，它支持多种持久化技术，包括JPA、Hibernate、MyBatis等。Spring Data提供了一套简洁的API，可以方便地进行数据访问和操作。
6. **Mybatis-plus**：Mybatis的升级版，内置了许多CURD方法，在数据层和业务层都极大程度简化了开发。

#### 5.3.1 SpringBoot内置持久化解决方案

SpringBoot内置了多种持久化解决方案，可以轻松地进行数据库操作。

1. Spring Data JPA：Spring Boot内置了Spring Data JPA，它是Spring Data项目的一部分，是一个ORM框架，可以将Java对象映射到关系型数据库中的表格中。它支持多种数据库，包括MySQL、PostgreSQL、Oracle等。
2. Spring Data JDBC：Spring Boot还内置了Spring Data JDBC，它是一种基于JDBC的持久化框架，可以直接操作SQL语句。相比于ORM框架，Spring Data JDBC更加轻量级，适用于简单的数据访问场景。
3. Spring Data MongoDB：如果你需要使用文档型数据库，那么Spring Boot内置了Spring Data MongoDB。它是Spring Data项目的一部分，可以将Java对象映射到MongoDB中的集合中。
4. Spring Data Redis：Spring Boot内置了Spring Data Redis，它是Spring Data项目的一部分，可以访问Redis数据库。
5. JDBC Template：如果你需要使用JDBC进行数据访问，Spring Boot内置了JDBC Template，它是一个简单而强大的JDBC操作模板。

#### 5.3.2 内嵌数据库

Spring Boot内置了三种内嵌数据库：

1. H2 Database：H2 Database是一种基于Java编写的轻量级关系型数据库，可以作为内置数据库使用。它不需要安装，只需要在项目中添加相应的依赖，就可以轻松地进行数据访问和操作。H2 Database支持SQL语法和JDBC API，可以很好地与Spring Boot集成。
2. Apache Derby：Apache Derby是一种基于Java编写的轻量级关系型数据库，也可以作为内置数据库使用。它与H2 Database类似，不需要安装，只需要在项目中添加相应的依赖，就可以轻松地进行数据访问和操作。Apache Derby支持SQL语法和JDBC API，可以很好地与Spring Boot集成。
3. HSQLDB：HSQLDB也是Spring Boot内置的一种内嵌式数据库。HSQLDB是一种基于Java的关系型数据库，支持SQL语法和JDBC API，并且具有高性能和可靠性。在Spring Boot应用程序中，默认情况下会自动配置HSQLDB作为内置数据库，以便在开发和测试阶段使用。但是在生产环境中，通常需要使用更加稳定和可靠的外部数据库，如MySQL、PostgreSQL等。

内置数据库适用于一些简单的应用程序或演示项目，如果需要更高的性能或更复杂的数据操作，建议使用外部数据库，如MySQL、PostgreSQL等。在实际开发中，选择合适的数据库要考虑到应用程序的实际情况，如数据容量、并发性、安全性等方面，以达到更好的性能和可靠性。

### 5.4 CAP定理（CAP theorem）

在计算机科学中, CAP定理（CAP theorem）, 又被称作 布鲁尔定理（Brewer's theorem）, 它指出对于一个分布式计算系统来说，不可能同时满足以下三点:

- 一致性(Consistency) (所有节点在同一时间具有相同的数据)

- 可用性(Availability) (保证每个请求不管成功或者失败都有响应)
- 分区容错性(Partition tolerance) (系统中任意信息的丢失或失败不会影响系统的继续运作)

CAP理论的核心是：一个分布式系统不可能同时很好的满足一致性，可用性和分区容错性这三个需求，最多只能同时较好的满足两个。

因此，根据 CAP 原理将 NoSQL 数据库分成了满足 CA 原则、满足 CP 原则和满足 AP 原则三 大类：

- CA - 单点集群，满足一致性，可用性的系统，通常在可扩展性上不太强大。
- CP - 满足一致性，分区容忍性的系统，通常性能不是特别高。
- AP - 满足可用性，分区容忍性的系统，通常可能对一致性要求低一些。

### 5.5 Redis持久化

在Redis中通过配置实现持久化是比较简单的，下面将以Spring Boot项目使用Redis作为数据存储的实现方式为例，演示如何在项目中实现Redis的持久化。

1. 首先需要在pom.xml文件中添加以下依赖：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

2. 然后在application.yml或者application.properties文件中进行Redis的配置，下面是一个示例：

```yml
spring:
  redis:
    host: localhost
    port: 6379
    password: null
    database: 0
    jedis:
      pool:
        max-active: 8
        max-wait: -1ms
        max-idle: 8
        min-idle: 0
    timeout: 10000ms
```

这里我们配置了Redis的地址、端口、密码和数据库编号等信息，并设置了连接池的一些参数和超时时间。

#### 5.5.1 配置Redis持久化方式

Redis提供了两种持久化方式：RDB和AOF。在Spring Boot中，可以通过以下几种方式来配置Redis的持久化方式：

1. 在application.yml或者application.properties文件中进行设置，示例如下：

```yml
spring:
  redis:
    ...
    # 开启RDB持久化方式
    redisson:
      config:
        codec: org.redisson.codec.JsonJacksonCodec
        useSingleServer: true
        singleServerConfig:
          address: "redis://127.0.0.1:6379"
    # 开启AOF持久化方式
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
      client:
        resources:
          readFrom: REPLICA_PREFERRED
          timeout: 10000ms
        shutdown-timeout: 100ms
      redis:
        database: 0
        host: localhost
        port: 6379
        password: null
        jedis:
          pool:
            max-active: 8
            max-wait: -1ms
            max-idle: 8
            min-idle: 0
        timeout: 10000ms
        lettuce:
          pool:
            enabled: true
            max-active: 8
            max-idle: 8
            min-idle: 0
          cluster:
            refresh:
              adaptive: true
              adaptive-multiplier: 2
              refresh-period: 5s
              update-interval: 100ms
              validate-cluster-node-status: true
```

这里我们在配置文件中使用了Spring Boot官方提供的Lettuce和Redisson客户端，同时开启了RDB和AOF两种持久化方式，并设置了一些其他的参数，如编解码方式、连接池大小等。

2. 通过Java配置类的方式实现：

```java
@Configuration
@EnableCaching
public class RedisConfig extends CachingConfigurerSupport {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .build();
    }

    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://127.0.0.1:6379");
        return Redisson.create(config);
    }
}
```

这里我们通过Java配置类的方式来配置RedisTemplate和RedisCacheManager以及RedissonClient，同时设置了key和value的序列化方式为String和JSON格式。这种方式相对于在配置文件中进行配置，更加灵活，可以根据实际业务需求来进行定制。

## 6. 整合第三方技术

### 6.1 缓存

SpringBoot内置了多种缓存解决方案，可以轻松地实现缓存功能。

1. Spring Cache：Spring Cache是Spring框架中的缓存抽象层，可以集成多种缓存技术，如EhCache、Redis、Guava等。在Spring Boot应用程序中，可以使用Spring Cache来进行缓存的数据访问和操作。Spring Cache提供了简单的注解，如@Cacheable、@CachePut、@CacheEvict等，可以方便地实现缓存功能。
2. Caffeine：Caffeine是一种基于Java的高性能缓存库，可以作为Spring Boot的缓存解决方案使用。它具有高速缓存、高并发、时间过期、大小限制等特性，可以应用于各种场景。在Spring Boot应用程序中，可以使用Caffeine来进行缓存的数据访问和操作。
3. EhCache：EhCache是一种基于Java的开源缓存库，也可以作为Spring Boot的缓存解决方案使用。它具有高速缓存、高并发、时间过期、大小限制等特性，可以应用于各种场景。在Spring Boot应用程序中，可以使用EhCache来进行缓存的数据访问和操作。
4. Redis：
5. memcached
6. jetcache
7. j2cache

#### 6.1.2缓存与持久化

缓存：即临时或短时间存储，非持久化存储。将数据存放与内存或高速存储器。与之相反的概念是持久化存储，存放与硬盘，可长时间保存，MySQL的数据存储。

缓存

- 优点：缓存，存放在内存，所以访问和更改等操作速度极快，
- 缺点：不能长时间存储，服务器关闭即销毁

持久化：

- 优点：可以长时间存储
- 缺点：在需要对数据频繁执行操作时性能会很差，因为每次都需要访问数据库。

将需要频繁访问且变更不频繁的数据放于缓存，这里主要是访问，因为在执行更改频繁的操作时为确保数据同步还是得直接操作数据库。对于更改不频繁的操作放于数据库和缓存都可以。

### 6.2 数据淘汰策略

常见注解

在Spring Boot框架中，缓存是一项常用的技术，可将一些经常查询且数据变更不频繁的数据保存到内存或其他高速存储器中，以减少数据库等数据源频繁访问的压力，提高系统性能。

Spring Boot框架自带了多种缓存实现，最常用的是基于注解的缓存，通过在方法上添加@Cacheable、@CachePut和@CacheEvict等注解来控制缓存的读取、更新和删除操作。具体来说，这些注解的作用如下：

1. @Cacheable：标记一个方法可以被缓存，当在执行该方法时，系统会先去缓存中查找是否有已经缓存过的结果，如果有，则直接返回前面缓存的结果，否则继续执行方法并将结果缓存起来。

2. @CachePut：更新缓存，即每次都执行该方法，并将返回值保存到缓存中。

3. @CacheEvict：清除缓存，即从缓存中清除指定的缓存项。

Spring Boot支持多种缓存管理器，包括Ehcache、Guava、Redis等，开发者可以根据自己的实际需求选择合适的缓存实现方式。

需要注意的是，使用缓存时需要考虑缓存的适用范围和缓存策略，对于经常更新的数据或者容易变化的数据，不适合使用缓存；对于需要保密的数据，也不宜使用缓存。同时，在使用缓存时要注意缓存过期策略、缓存分区、缓存清理等问题，以确保数据的准确性和及时性。

### 6.3 任务

#### 6.3.1 概括

任务（Task）是指需要定期执行的某些操作，例如定时发送邮件、更新缓存、备份数据库等。Spring Boot框架提供了多种机制来实现任务调度，最常用的是基于注解的方式和集成第三方的定时任务框架。

在计算机编程中，任务（Task）通常可以分为以下几种类型：

1. 一次性任务：指只需要执行一次的任务，例如初始化数据、备份数据库等。

2. 周期性任务：指需要在固定时间间隔内重复执行的任务，例如定时更新缓存、定时发送邮件等。

3. 延迟任务：指需要在一定延迟后才能执行的任务，例如定时器等待一段时间后执行某个操作。

4. 异步任务：指需要异步处理的任务，例如异步调用第三方接口、异步下载文件等。

5. 并发任务：指需要并发执行的任务，例如多线程实现的任务。

任务多种多样，每种类型都有其自己的特点和应用场景。Spring Boot框架支持其中的一些任务类型，例如周期性任务通过集成Quartz或者使用@Scheduled注解实现，异步任务通过使用@Async注解实现，并发任务可以通过Java多线程等技术实现。开发者需要根据自身业务需求选择合适的任务类型以及相应的任务实现方式。定时任务属于一种周期性任务

#### 6.3.2 实现

1. 基于注解的方式

通过在方法上使用@Scheduled注解，可以定义该方法需要定期执行的时间间隔或执行时间点。例如，下面的代码可以使方法每5秒钟执行一次：

```java
@Scheduled(fixedRate = 5000)
public void taskMethod() {
    // 执行任务内容
}
```

2. 集成第三方的定时任务框架

Spring Boot框架也支持集成一些第三方的定时任务框架，例如Quartz、JDK Timer等。通过配置相应的Bean，可以实现类似于上述@Scheduled注解的功能，同时还可以支持更丰富的任务调度需求，例如分布式任务调度、动态修改任务定时策略等。

```java
public static void main(String[] args) {
    Timer timer = new Timer();
    TimerTask timerTask = new TimerTask() {
        @Override
        public void run() {
            System.out.println("this is a timerTask");
        }
    };
    timer.schedule(timerTask,0,2000);
}
```

#### 6.3.3 定时任务框架

- Quartz

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
</dependency>
```

- spring task

内置的，不需要导包

- 开启定时任务功能

```java
@SpringBootApplication
@EnableScheduling//开启定时任务功能
public class SpringBootCacheApplication {
    public static void main(String[] args) {
        SpringApplication.run(SpringBootCacheApplication.class, args);
    }
}
```

- 使用


```java
@Component//定义成Bean
public class MyTask {
    //具体定时任务
    @Scheduled(cron = "0/1 * * * * ?")//cron表达式
    public void task(){
        System.out.println("spring task is running");
    }
}
```

#### 6.3.4 cron表达式

Cron表达式是一种时间表达式，用于指定定时任务的执行时间。Cron表达式由6个字段组成，分别表示秒、分钟、小时、日期、月份和星期几。每个字段都有特定的取值范围和含义。Cron表达式的格式如下：

```
秒 分 时 日 月 星期
```

各个字段的取值范围如下：

1.秒（0-59）

2.分钟（0-59）

3.小时（0-23）

4.日期（1-31）

5.月份（1-12或JAN-DEC）

6.星期几（0-6或SUN-SAT，0表示周日）

Cron表达式还支持一些特殊字符，如*（表示任意值）、?（表示不指定）、-（表示范围）、/（表示间隔）、,（表示多个值）等。例如，下面是一些常见的Cron表达式示例：

1.每隔5秒钟执行一次：`*/5 * * * * *`

2.每天23点执行一次：`0 0 23 * * ?`

3.每周一、三、五的10点钟执行一次：`0 0 10 ? * MON,WED,FRI`

4.每月最后一天的23点钟执行一次：`0 0 23 L * ?`

在Spring Boot中，可以使用@Scheduled注释的cron属性来指定Cron表达式。例如：

```java
@Scheduled(cron = "0 0 23 * * ?")
public void doSomething() {
    //TODO: 执行任务
}
```

这将会在每天23点执行一次doSomething方法。

### 6.4 整合javamail

#### 6.4.1 相关协议

- SMTP

  - 邮件传输协议

- POP3

  - 接受电子邮件标准协议

- IMAP

  - 互联网消息协议，代替POP3

#### 6.4.2 使用

1. 导包

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

2. 配置

```yml
mail:
  username: zhaoxi7109@qq.com
  password: kaxkznmacmnqddif
  host: smtp.qq.com
```

3. 密码获取

密码不是QQ邮箱密码，而是要到QQ邮箱中开启IMAP服务，然后获取密码

### 6.5 消息

#### 6.5.1 概念

在Spring Boot中，消息（Message）是指作为数据传输载体的一段信息，可以是文本、二进制数据或者一些结构化数据。消息通常被用于异步通信场景，例如消息队列、发布-订阅等模式中。

Spring Boot提供了多个框架和技术来支持消息传输，包括JMS（Java Message Service）、AMQP（Advanced Message Queuing Protocol）、WebSocket等。其中，Spring Boot内置了一个轻量级的消息代理Broker——Spring AMQP，可以方便地实现基于AMQP协议的消息传输。

在使用Spring Boot中的消息传输组件时，需要定义消息的生产者和消费者。生产者负责创建消息并将其发送到消息队列或主题中，而消费者则从队列或主题中接收并处理消息。在Spring Boot中，我们可以使用@RabbitListener注解定义一个消息监听器，来监听并消费指定的队列或主题中的消息。

消息是指在应用程序之间传递的数据，通常用于实现异步通信、解耦合和缓冲等功能。在Spring Boot中，可以使用消息队列来实现消息传递。Spring Boot提供了多个消息队列实现，如ActiveMQ、RabbitMQ、Kafka等。其中，RabbitMQ是最常用的消息队列之一，它提供了丰富的功能和易于使用的API，可以快速地构建强大的消息系统。

#### 6.5.2 RobbitMQ使用

在Spring Boot中使用RabbitMQ实现消息传递，需要进行以下步骤：

1.添加依赖：在pom.xml文件中添加spring-boot-starter-amqp依赖。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

2.配置连接信息：在application.properties文件中配置RabbitMQ连接信息。

```properties
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest
```

3.创建消息发送者：使用@Autowired注释注入AmqpTemplate对象，并使用它发送消息。

```java
@Autowired
private AmqpTemplate rabbitTemplate;
public void sendMessage(String message) {
    rabbitTemplate.convertAndSend("exchangeName", "routingKey", message);
}
```

4.创建消息接收者：使用@RabbitListener注释注入消息接收者，并处理接收到的消息。

```java
@RabbitListener(queues = "queueName")
public void receiveMessage(String message) {
    //TODO: 处理接收到的消息
}
```

在以上步骤中，exchangeName和routingKey是RabbitMQ中的概念，用于将消息发送到指定的队列。队列是RabbitMQ中的基本单元，用于存储和传递消息。在使用RabbitMQ时，需要定义exchange和queue，并将它们绑定在一起，以便于消息的传递和处理。
使用消息队列可以使应用程序实现高效的异步通信、解耦合和缓冲等功能，从而提高应用程序的性能和可靠性。

以下是一个使用Spring Boot和RabbitMQ实现基于AMQP协议的消息传输的示例：

```java
// 定义一个消息监听器，并通过@RabbitListener注解指定监听的队列名
@RabbitListener(queues = "myqueue")
public void receiveMessage(String message) {
    // 处理接收到的消息
    System.out.println("Received message: " + message);
}

// 创建一个消息生产者，并使用RabbitTemplate发送消息到指定的交换机和队列
@Autowired
private RabbitTemplate rabbitTemplate;

public void sendMessage(String message) {
    rabbitTemplate.convertAndSend("myexchange", "myroutingkey", message);
}
```

以上代码中，我们创建了一个名为"myqueue"的队列，并定义了一个使用@RabbitListener注解的消息监听器，用来监听该队列收到的消息。此外，我们还创建了一个使用RabbitTemplate发送消息到队列中的生产者。通过调用RabbitTemplate的convertAndSend方法，可以将消息发送到指定的交换机和队列中。

需要注意的是，在使用Spring Boot和消息传输组件时，需要配置相关组件的参数和地址，并且需要注意消息的序列化和反序列化方式以及消息过期时间等问题。

- JMS

  - Java message service
  - 一种规范，类似jdbc
  - 消息模型

    - 点对点模型
    - 发布订阅模型

- AMQP

  - 一种协议

    - 规范了网络交换的数据格式

  - 高级消息队列协议
  - 消息模型

    - direct exchange
    - fanout exchange
    - topic exchange
    - headers exchange
    - system exchange

  - 消息种类

    - byte[]

- MQTT

### 6.5.3 ActiveMQ

1. 导包

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-activemq</artifactId>
    <version> 2.7.1</version>
</dependency>
```

2. 配置

### 6.6 监控

在Spring Boot中，可以使用Actuator来实现应用程序的监控和管理。Actuator是Spring Boot的一个子项目，提供了很多有用的端点（Endpoints），可以用来监控和管理应用程序。Actuator中的端点包括健康检查、应用程序信息、系统信息、环境变量、配置属性、日志信息等。可以使用HTTP请求或JMX访问这些端点，并查看或修改应用程序的状态和配置信息。

例如，可以通过访问`/actuator/health`端点来获取应用程序的健康状态：

```
{
    "status": "UP"
}
```

还可以通过访问`/actuator/info`端点来获取应用程序的信息：

```
{
    "app": {
        "name": "myapp",
        "version": "1.0.0"
    }
}
```

在默认情况下，Actuator的端点是开放的，可以通过HTTP请求或JMX访问。如果需要保护端点，可以通过配置Spring Security来实现。例如，在application.properties文件中添加以下配置：

```
spring.security.user.name=admin
spring.security.user.password=admin
management.endpoints.web.exposure.include=health,info
```

这将会在保护的情况下开放health和info端点，并使用admin/admin作为用户名和密码进行访问。
Actuator还提供了很多其他的端点，可以根据需要进行配置和使用。使用Actuator可以快速地实现应用程序的监控和管理，从而提高应用程序的可靠性和可维护性。

- 监控的意义
- 可视化监控平台
- 监控原理
- 自定义监控指标

### 6.7 技术选型

技术选型是指在开发项目时选择使用哪些技术和框架的过程。在选择技术和框架时，需要考虑多个因素，如项目需求、开发团队技术水平、可维护性、性能、安全性等。在选择技术和框架时，需要权衡这些因素，选择最适合项目的技术和框架。
以下是一些可能用于Spring Boot项目的技术和框架：

1. 数据库：Spring Boot支持多种数据库，如MySQL、PostgreSQL、Oracle、MongoDB等。选择数据库时需要考虑数据量、数据结构、事务性能、高可用性等因素。
2. 框架：Spring Boot是一个轻量级的框架，可以集成多种其他框架，如Spring Cloud、MyBatis、Hibernate、**Thymeleaf**、**Freemarker**等。选择框架时需要考虑框架的成熟度、功能特性、易用性等因素。
3. 缓存：Spring Boot支持多种缓存技术，如Redis、Ehcache、Caffeine等。选择缓存技术时需要考虑缓存的数据类型、缓存的大小、缓存的过期策略等因素。
4. 消息队列：Spring Boot支持多种消息队列技术，如ActiveMQ、RabbitMQ、Kafka等。选择消息队列时需要考虑消息的类型、消息的大小、消息的可靠性等因素。
5. 安全性：Spring Boot提供了多种安全技术，如Spring Security、OAuth2等。选择安全技术时需要考虑安全级别、认证方式、授权策略等因素。
6. 日志：Spring Boot支持多种日志框架，如Logback、Log4j2、Java Util Logging等。选择日志框架时需要考虑日志的输出方式、日志的性能、日志的可读性等因素。
7. 测试：Spring Boot支持多种测试框架，如JUnit、Mockito、Hamcrest等。选择测试框架时需要考虑测试的类型、测试的覆盖率、测试的易用性等因素。

## 7. idea快捷键

以下是在IntelliJ IDEA中常用的快捷键列表：

1. 基本编辑

- Ctrl + C / Ctrl + X / Ctrl + V：复制、剪切、粘贴
- Ctrl + Z / Ctrl + Shift + Z：撤销、重做
- Ctrl + F / Ctrl + R：查找、替换
- Ctrl + D：复制当前行或选定的区域
- Ctrl + Y：删除当前行或选定的区域
- Ctrl + N：查找类
- Ctrl + Shift + N：查找文件
- Ctrl + Alt + L：格式化代码
- Ctrl + Alt + O：优化导入的包

2. 代码编辑

- Ctrl + Space：自动完成代码
- Ctrl + Shift + Enter：自动补全语句
- Alt + Enter：快速修复代码问题
- Ctrl + P：显示方法参数
- Ctrl + Shift + I：显示方法定义
- Ctrl + B：跳转到定义处
- Ctrl + U：跳转到父类方法
- Ctrl + Alt + B：跳转到实现处

3. 导航

- Ctrl + E：显示最近打开的文件列表
- Ctrl + Shift + E：显示最近修改的文件列表
- Ctrl + G：跳转到指定行
- Ctrl + Shift + F：在项目中查找文本
- Ctrl + Shift + G：在项目中查找引用

4. 运行和调试

- Shift + F10：运行当前程序
- Shift + F9：调试当前程序
- Ctrl + Shift + F10：重新运行上次运行的程序
- Ctrl + F2：停止程序运行
- F7：进入方法内部
- Shift + F8：跳出方法
- F9：恢复程序运行
- Alt + F9：运行到光标处

5. Git集成

- Ctrl + K：提交代码
- Ctrl + Shift + K：推送代码
- Ctrl + Alt + Z：回退到上一个版本
- Ctrl + Alt + Shift + Z：回退到指定版本
- Ctrl + D：显示文件差异
- Ctrl + Shift + A：查找Git命令

6. 其他

- Ctrl + Q：显示文档注释
- Ctrl + Shift + U：切换大小写
- Ctrl + Shift + J：合并选定的行
- Ctrl + Shift + T：生成测试代码
- Ctrl + Alt + T：生成代码块
- Alt   +  F1：显示当前文件在项目视图中的位置
- Alt   +  Insert：生成代码
- Alt   +  shift+方向键  整行上下移动
- Ctrl  +   h   导出类相关  子类或接口
- Shift+   f6   重命名
- Alt   +   enter   显示上下文操作
- Shift+   shift   搜索
- Ctrl  +   shift+alt+/    进入注册表

## 8. 常用注解

### 8.1Spring常用注解

1. @Component注解
   @Component是Spring中最基本的注解之一，用于标注一个类为Spring组件。其常用属性如下：

- value：指定组件的名称，如果不指定则默认为类名首字母小写。

2. @Autowired注解
   @Autowired用于自动装配Spring组件，可以用于依赖注入（DI）和控制反转（IOC）。其常用属性如下：

- required：指定是否必须存在该组件，默认为true，表示必须存在，如果不存在则会抛出异常。

3. @Controller注解
   @Controller用于标注一个类为Spring MVC控制器，用于处理HTTP请求和响应。其常用属性如下：

- value：指定控制器的名称，如果不指定则默认为类名首字母小写。

4. @Service注解
   @Service用于标注一个类为Spring服务组件，通常用于业务逻辑处理。其常用属性如下：

- value：指定服务的名称，如果不指定则默认为类名首字母小写。

5. @Repository注解
   @Repository用于标注一个类为Spring数据访问组件，通常用于访问数据库或其它数据源。其常用属性如下：

- value：指定数据访问组件的名称，如果不指定则默认为类名首字母小写。

6. @RequestMapping注解
   @RequestMapping用于映射HTTP请求到控制器方法，可以指定请求路径、请求方法、请求参数等。其常用属性如下：

- value：指定请求路径，可以包含占位符和Ant风格的通配符。
- method：指定请求方法，支持GET、POST、PUT、DELETE等HTTP方法。
- params：指定请求参数，支持简单的表达式语言。
- headers：指定请求头部，支持简单的表达式语言。

7. @PathVariable注解
   @PathVariable用于获取URL路径变量的值，通常用于RESTful风格的API开发。其常用属性如下：

- value：指定路径变量的名称，可以包含占位符和Ant风格的通配符。

8. @RequestParam注解
   @RequestParam用于获取HTTP请求参数的值，可以指定参数名称、是否必需、默认值等。其常用属性如下：

- value：指定请求参数的名称，可以包含占位符和Ant风格的通配符。
- required：指定是否必须存在该参数，默认为true，表示必须存在，如果不存在则会抛出异常。
- defaultValue：指定参数的默认值，如果请求中不存在该参数则使用默认值。

9. @ResponseBody注解
   @ResponseBody用于将方法返回值转换为HTTP响应内容，通常用于返回JSON、XML等格式的数据。其常用属性如下：

- 不包含任何属性。

10. @Transactional注解
    @Transactional用于标注一个方法为事务性操作，通常用于数据库操作或其它需要保证数据一致性的操作。其常用属性如下：

- value：指定事务管理器的名称，可以使用多个事务管理器。

### 8.2 SpringMVC常用注解

SpringMVC是基于Spring框架的Web开发框架，提供了许多注解来简化开发过程。以下是一些常用的SpringMVC注解及其属性介绍：

1. @Controller注解

@Controller用于标注一个类为SpringMVC控制器，用于处理HTTP请求和响应。其常用属性与Spring的@Controller注解相同。

2. @RequestMapping注解

@RequestMapping用于映射HTTP请求到控制器方法，可以指定请求路径、请求方法、请求参数等。其常用属性如下：

- value：指定请求路径，可以包含占位符和Ant风格的通配符。
- method：指定请求方法，支持GET、POST、PUT、DELETE等HTTP方法。
- params：指定请求参数，支持简单的表达式语言。
- headers：指定请求头部，支持简单的表达式语言。

3. @PathVariable注解

@PathVariable用于获取URL路径变量的值，通常用于RESTful风格的API开发。其常用属性如下：

- value：指定路径变量的名称，可以包含占位符和Ant风格的通配符。

4. @RequestParam注解

@RequestParam用于获取HTTP请求参数的值，可以指定参数名称、是否必需、默认值等。其常用属性如下：

- value：指定请求参数的名称，可以包含占位符和Ant风格的通配符。
- required：指定是否必须存在该参数，默认为true，表示必须存在，如果不存在则会抛出异常。
- defaultValue：指定参数的默认值，如果请求中不存在该参数则使用默认值。

5. @ResponseBody注解

@ResponseBody用于将方法返回值转换为HTTP响应内容，通常用于返回JSON、XML等格式的数据。其常用属性与Spring的@ResponseBody注解相同。

6. @ModelAttribute注解

@ModelAttribute用于将HTTP请求参数绑定到控制器方法的参数或返回值中，其常用属性如下：

- value：指定属性的名称，可以使用占位符和SpEL表达式。

7. @SessionAttributes注解

@SessionAttributes用于将控制器方法的参数或返回值保存到HTTP Session中，其常用属性如下：

- value：指定要保存到Session中的属性名称列表，可以使用占位符和SpEL表达式。

8. @InitBinder注解

@InitBinder用于初始化WebDataBinder，可以用于自定义数据绑定逻辑。其常用属性如下：

- value：指定要初始化的WebDataBinder的名称，可以使用占位符和SpEL表达式。

### 8.3 SpringBoot常用注解

1. @SpringBootApplication注解
   @SpringBootApplication是Spring Boot中最常用的注解之一，包含了@SpringBootConfiguration、@EnableAutoConfiguration和@ComponentScan三个注解的功能。其常用属性如下：

- exclude：排除自动配置的类，可以用于禁用不需要的自动配置。

2. @RestController注解
   @RestController是Spring Boot中用于标注一个类为RESTful风格的控制器的注解。其常用属性与Spring的@Controller注解相同。

3. @RequestMapping注解
   @RequestMapping在Spring Boot中同样也是用于映射HTTP请求到控制器方法的注解，其常用属性与Spring的@RequestMapping注解相同。

4. @Autowired注解
   @Autowired在Spring Boot中同样也是用于自动装配Spring组件的注解，其常用属性与Spring的@Autowired注解相同。

5. @Value注解
   @Value用于将配置文件中的属性值注入到一个Java类中，其常用属性如下：

- value：指定配置文件中的属性名称，可以使用占位符和SpEL表达式。

6. @ConfigurationProperties注解
   @ConfigurationProperties用于将配置文件中的属性值注入到一个Java类中，其常用属性如下：

- prefix：指定属性的前缀名称，用于指定要注入的属性。

7. @EnableConfigurationProperties注解
   @EnableConfigurationProperties用于启用@ConfigurationProperties注解，使得@ConfigurationProperties注解生效。

8. @EnableAutoConfiguration注解
   @EnableAutoConfiguration用于自动配置Spring Boot应用程序，其常用属性如下：

- exclude：排除自动配置的类，可以用于禁用不需要的自动配置。

9. @Conditional注解
   @Conditional用于根据条件来控制是否启用某个配置项，其常用属性如下：

- value：指定一个条件类，符合条件则启用该配置项。

### 8.4 SpringCloud常用注解

1. @EnableDiscoveryClient注解

@EnableDiscoveryClient用于启用服务注册和发现功能，可以将服务注册到服务注册中心，并从服务注册中心获取服务列表。其常用属性如下：

- value：指定服务注册中心的名称，可以使用多个服务注册中心。

2. @FeignClient注解

@FeignClient用于声明一个基于HTTP的RESTful客户端，可以使用该客户端调用远程服务。其常用属性如下：

- value：指定远程服务的名称，可以使用占位符和SpEL表达式。
- fallback：指定远程服务调用失败时的降级处理类，必须实现当前注解指定的接口。

3. @HystrixCommand注解

@HystrixCommand用于声明一个基于Hystrix的服务降级处理方法，可以在远程服务调用失败时执行该方法。其常用属性如下：

- fallbackMethod：指定服务降级处理方法的名称，必须在当前类中定义。

4. @EnableCircuitBreaker注解

@EnableCircuitBreaker用于启用基于Hystrix的服务降级处理功能，可以在远程服务调用失败时执行降级处理逻辑。

5. @LoadBalanced注解

@LoadBalanced用于启用基于Ribbon的负载均衡功能，可以将请求分发到多个实例中。其常用属性与Spring的@Qualifier注解相同。

6. @EnableZuulProxy注解

@EnableZuulProxy用于启用基于Zuul的API网关功能，可以将多个微服务的API聚合到一个网关中。其常用属性如下：

- value：指定Zuul代理服务的路径，可以使用占位符和SpEL表达式。

## 9. 其他

### 9.1 数据库字符集

在使用Navicat创建数据库时，对于字符集和排序规则的选择非常重要，因为它们会影响数据库的数据存储和查询结果。

1. 字符集决定了数据库中存储的字符集类型，包括文字、数字和符号等。通常情况下，建议选择utf8mb4字符集，因为它支持更广泛的语言和字符集，包括Emoji表情符号等。
2. 排序规则决定了在查询结果中如何对数据进行排序，包括大小写敏感和非大小写敏感等。建议选择utf8mb4_general_ci排序规则，因为它是一种不区分大小写的排序规则，适用于大多数情况下的查询。

## 10. Lunix

### 10.1 Linux概括

### 10.2 虚拟机VMWare中的网络适配器

VMware是一种虚拟化软件，它允许用户在一台计算机上运行多个虚拟机，每个虚拟机都可以运行不同的操作系统和应用程序。在VMware中，每个虚拟机都有自己的网络适配器，用于连接虚拟机到主机或其他虚拟机的网络。

官方文档：[配置虚拟网络适配器设置 (vmware.com)](https://docs.vmware.com/cn/VMware-Workstation-Pro/16.0/com.vmware.ws.using.doc/GUID-C82DCB68-2EFA-460A-A765-37225883337D.html)

#### 10.2.1 桥接模式

**Bridged Adapter**（桥接适配器）：桥接适配器将虚拟机连接到主机（就是安装VMware的最基础的那台电脑，不是VMware中的操作系统）的物理网络，使虚拟机可以像主机一样与其他计算机通信。也就是主机连接的是哪个网络虚拟机就直接连接哪个网络，但是由于虚拟机内虚拟出来的Linux系统也可看做一台主机，所以虚拟机的网络地址由物理网络的DHCP服务器分配后会与主机不同。就相当于两台不同电脑连接同一网络会分配不同IP。

可以在对应Linux操作系统（VMware虚拟出来的）终端中使用指令：

```
ifconfig
```

其中ens33中的inet 192.168.1.105就是该Linux的网络地址，拿到IP后就可以通过FinalShell进行远程连接。但是目前我只知道在对应Linux中获取IP，并不知道怎么通过主机直接获取，所以这种方式每次都要打开Linux。

```
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::f8a2:735f:8772:d7e2  prefixlen 64  scopeid 0x20<link>
        ether 00:0c:29:4f:e4:21  txqueuelen 1000  (Ethernet)
        RX packets 224357  bytes 325285393 (310.2 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 73368  bytes 5235140 (4.9 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

#### 10.2.2 NAT模式

NAT Adapter（网络地址转换适配器）：NAT适配器将虚拟机连接到主机的网络，但虚拟机的网络地址由VMware的NAT服务分配。该适配器通常用于在虚拟机中运行客户端应用程序，例如Web浏览器。

#### 10.2.3 仅主机模式

Host-only Adapter（主机专用适配器）：主机专用适配器将虚拟机连接到主机的虚拟网络中，但不会连接到主机的物理网络。这种适配器通常用于在虚拟机之间进行通信或在虚拟机和主机之间进行安全的本地通信。

#### 10.2.4 自定义模式

Custom Adapter（自定义适配器）：自定义适配器允许用户创建自己的虚拟网络配置。该适配器通常用于测试和开发目的。

用户可以根据需要选择不同类型的网络适配器来满足其网络需求。
