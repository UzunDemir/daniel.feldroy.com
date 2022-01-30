---
date: '2011-09-23T09:49:00.000-07:00'
description: ''
published: true
slug: 2011-09-profiles-breaking-normalization
tags:
- django
- django-profiles
- legacy-blogger
time_to_read: 5
title: 'Profiles: Breaking Normalization'
---

*This was originally posted on blogger [here](https://pydanny.blogspot.com/2011/09/profiles-breaking-normalization.html)*.

In the summer of 2010 I either saw this pattern or cooked it up myself. It is specific to the <a href="http://djangoproject.com/">Django</a> <a href="https://docs.djangoproject.com/en/dev/topics/auth/#storing-additional-information-about-users">profiles</a> system and helps me get around some of the limitations/features of <a href="https://docs.djangoproject.com/en/1.3/topics/auth/">django.contrib.auth</a>. I like to do it on my own projects because it makes so many things (like performance) so much simpler. The idea is to replicate some of the fields and methods on the<a href="https://docs.djangoproject.com/en/1.3/topics/auth/#users">     django.contrib.auth.model.User    </a> model in your user profile(s) objects. I tend to do this usually on the     <a href="https://docs.djangoproject.com/en/1.3/topics/auth/#django.contrib.auth.models.User.email">email</a>    ,     <a href="https://docs.djangoproject.com/en/1.3/topics/auth/#django.contrib.auth.models.User.first_name">first_name</a>    ,     <a href="https://docs.djangoproject.com/en/1.3/topics/auth/#django.contrib.auth.models.User.last_name">last_name</a>     fields and the     <a href="https://docs.djangoproject.com/en/1.3/topics/auth/#django.contrib.auth.models.User.get_full_name">get_full_name</a>     method. Sometimes I also do it on the <a href="https://docs.djangoproject.com/en/1.3/topics/auth/#django.contrib.auth.models.User.username">username</a> field, but then I also ensure that the username duplication is un-editable in any context.<br /><br />Sure, this breaks <a href="http://pydanny.blogspot.com/2011/07/normalization-noitazilamron.html">normalization</a>, but the scale of this break is tiny. Duplicating four fields each with a max of 30 characters for a total of 120 characters per record is nothing in terms of data when you compare to avoiding the mess of doing lots of <b>profile-to-user</b> joins on very large data sets.<br /><br />One more thing, I've found that most users don't care about or for the division between their accounts and profiles. They are more than happy with a single form, and if they aren't, well you can still use this profile model to build both account and profile forms.<br /><br />Alright, enough talking, let me show you how my Profile models tend to look:<br /><br /><pre class="prettyprint lang-py">from django.contrib.auth.models import User<br />from django.db import models<br />from django.utils.translation import ugettext_lazy as _<br /><br />class Profile(models.Model):<br />    """ Normalization breaking profile model authored by Daniel Greenfeld """<br />    <br />    user = models.OneToOneField(User)<br />    email = models.EmailField(_("Email"), help_text=_("Never given out!"), max_length=30)<br />    first_name = models.CharField(_("First Name"), max_length=30)<br />    last_name = models.CharField(_("Last Name"), max_length=30)<br /><br />    # username field notes:<br />    #     used to improve speed, not editable! <br />    #     Never changed after original auth.User and profiles.Profile creation!<br />    username = models.CharField(_("User Name"), editable=False) <br /><br />    def save(self, **kwargs):<br />        """ Override save to always populate changes to auth.user model """<br />        user_obj = User.objects.get(username=self.user.username)        <br />        user_obj.first_name = self.first_name<br />        user_obj.last_name = self.last_name<br />        user_obj.email = self.email<br />        user_obj.is_active = self.is_active        <br />        user_obj.save()<br />        super(Profile,self).save(**kwargs)<br /><br />    def get_full_name(self):<br />        """ Convenience duplication of the auth.User method """<br />        return "{0} {1}".format(self.first_name, self.last_name)<br /><br />    @models.permalink<br />    def get_absolute_url(self):<br />        return ("profile_detail", (), {"username": self.username})<br /><br />    def __unicode__(self):<br />        return self.username<br /></pre><br />All of this is good, but you have to be careful with emails. Django doesn't let you duplicate existing emails in the <b>django.contrib.auth.model.User</b> model so we want to catch that early and display an elegant error message. Hence this Profile form:<br /><br /><pre class="prettyprint lang-py">from django import forms<br />from django.contrib.auth.models import User<br />from django.utils.translation import ugettext_lazy as _<br /><br />from profiles.models import Profile<br /><br />class ProfileForm(forms.ModelForm):<br />    """ Email validation form authored by Daniel Greenfeld """<br />        <br />    def clean_email(self):<br />        """ Custom email clean method to make sure the user doesn't use the same email as someone else"""<br />        email = self.cleaned_data.get("email", "").strip()<br /><br />        if User.objects.filter(email=email).exclude(username=self.instance.user.username):<br />            self._errors["email"] = self.error_class(["%s is already in use in the system" % email])<br />            return ""            <br /><br />        return email<br /><br />    class Meta:<br />        <br />        fields = (<br />                    'first_name',<br />                    'last_name',<br />                    'email',<br />                    )<br />        model = Profile<br /></pre>

---

## 4 comments captured from [original post](https://pydanny.blogspot.com/2011/09/profiles-breaking-normalization.html) on Blogger

**Unknown said on 2011-09-23**

Would it be prudent to just inherit from the User model for the profile model and still do the same save method? Cut off some code that way.

**pydanny said on 2011-09-23**

Cezar - I should have put this in my post and that is &quot;Don't inherit from the auth.User model.&quot; Yeah, it is how we should be able to do it, but you end up with weirdness and problems. Hence the get_profile() model and this blog post.

**Chris Adams said on 2011-09-23**

Two notes: <br />* I'd add a post_save signal handler on User which would propagate changes forward if there's any possibility that something else will change those values directly<br />* in the save() method you can simply do a User.objects.filter(email=self.email).update(… denormalized fields…) to save a database query.

**pydanny said on 2011-09-23**

Chris - I use signals as little as possible. I keep getting bit by them. They are generally documented poorly, can make system migrations unreasonably difficult. And in this case, they can cause infinite loops because your Profile.save() will change the User which will change the Profile which will change the User, ad infinitum...<br /><br />I do like the User.objects.filter(email=self.email).update(… denormalized fields…) idea. :)
