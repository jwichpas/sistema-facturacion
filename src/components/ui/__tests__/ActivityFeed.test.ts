import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ActivityFeed from '../ActivityFeed.vue'
import type { FeedItem } from '../ActivityFeed.vue'

describe('ActivityFeed', () => {
  const mockItems: FeedItem[] = [
    {
      title: 'New order created',
      description: 'Order #12345 from ACME Corp',
      time: '2 minutes ago',
      meta: 'Sales',
      actor: 'John Doe',
    },
    {
      title: 'Product updated',
      description: 'iPhone 15 Pro stock updated',
      time: '1 hour ago',
      meta: 'Inventory',
    },
    {
      title: 'Payment received',
      time: '3 hours ago',
    },
  ]

  it('renders activity feed with title', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Recent Activity',
        items: mockItems,
      },
    })

    expect(wrapper.text()).toContain('Recent Activity')
  })

  it('displays all activity items', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: mockItems,
      },
    })

    expect(wrapper.text()).toContain('New order created')
    expect(wrapper.text()).toContain('Product updated')
    expect(wrapper.text()).toContain('Payment received')
  })

  it('shows item descriptions when provided', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: mockItems,
      },
    })

    expect(wrapper.text()).toContain('Order #12345 from ACME Corp')
    expect(wrapper.text()).toContain('iPhone 15 Pro stock updated')
  })

  it('displays time information for all items', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: mockItems,
      },
    })

    expect(wrapper.text()).toContain('2 minutes ago')
    expect(wrapper.text()).toContain('1 hour ago')
    expect(wrapper.text()).toContain('3 hours ago')
  })

  it('shows meta information when provided', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: mockItems,
      },
    })

    expect(wrapper.text()).toContain('Sales')
    expect(wrapper.text()).toContain('Inventory')
  })

  it('generates correct initials from actor names', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: [
          { title: 'Test', time: 'now', actor: 'John Doe' },
          { title: 'Test 2', time: 'now', actor: 'Jane Smith Wilson' },
          { title: 'Test 3', time: 'now', actor: 'A' },
        ],
      },
    })

    const avatars = wrapper.findAll('.rounded-full')
    expect(avatars[0].text()).toBe('JD')
    expect(avatars[1].text()).toBe('JS')
    expect(avatars[2].text()).toBe('A')
  })

  it('generates initials from title when no actor provided', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: [
          { title: 'System Update', time: 'now' },
          { title: 'Backup Complete', time: 'now' },
        ],
      },
    })

    const avatars = wrapper.findAll('.rounded-full')
    expect(avatars[0].text()).toBe('SU')
    expect(avatars[1].text()).toBe('BC')
  })

  it('handles empty actor/title gracefully', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity',
        items: [
          { title: '', time: 'now', actor: '' },
        ],
      },
    })

    const avatar = wrapper.find('.rounded-full')
    expect(avatar.text()).toBe('·')
  })

  it('renders actions slot when provided', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Activity Feed',
        items: mockItems,
      },
      slots: {
        actions: '<button class="view-all-btn">View All</button>',
      },
    })

    expect(wrapper.find('.view-all-btn').exists()).toBe(true)
    expect(wrapper.text()).toContain('View All')
  })

  it('handles empty items array', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Empty Activity',
        items: [],
      },
    })

    expect(wrapper.text()).toContain('Empty Activity')
    expect(wrapper.findAll('li').length).toBe(0)
  })

  it('applies dark mode classes correctly', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Dark Mode Test',
        items: mockItems,
      },
    })

    expect(wrapper.find('.dark\\:bg-gray-800').exists()).toBe(true)
    expect(wrapper.find('.dark\\:text-gray-100').exists()).toBe(true)
  })

  it('properly structures list items', () => {
    const wrapper = mount(ActivityFeed, {
      props: {
        title: 'Structure Test',
        items: mockItems,
      },
    })

    const listItems = wrapper.findAll('li')
    expect(listItems.length).toBe(mockItems.length)

    // Check that each item has the expected structure
    listItems.forEach((item, index) => {
      expect(item.find('.rounded-full').exists()).toBe(true) // Avatar
      expect(item.text()).toContain(mockItems[index].title)
      expect(item.text()).toContain(mockItems[index].time)
    })
  })
})
